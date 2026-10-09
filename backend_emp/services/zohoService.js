const supabase = require('../db');

/**
 * Zoho Integration Service
 * Handles employee profile sync to Zoho Books & Zoho CRM, and client analytics.
 */

let cachedToken = null;
let tokenExpiresAt = 0; // Timestamp in ms
let workingAccountsUrl = null;
let workingApiDomain = null;
let cachedClientsData = null;
let cachedClientsExpiresAt = 0;
let cachedAnalyticsData = null;
let cachedAnalyticsExpiresAt = 0;

// Default fallback client list when Zoho Books credentials are not yet set up
const DEFAULT_ZOHO_CLIENTS = [
  { id: 'cli_1', contact_id: '1001', contact_name: 'ABC Holdings', company_name: 'ABC Holdings PLC', email: 'contact@abcholdings.lk' },
  { id: 'cli_2', contact_id: '1002', contact_name: 'Ceylon Tea Exports', company_name: 'Ceylon Tea Exports Pvt Ltd', email: 'info@ceylontea.com' },
  { id: 'cli_3', contact_id: '1003', contact_name: 'Virtusa Sri Lanka', company_name: 'Virtusa Corporation', email: 'projects@virtusa.com' },
  { id: 'cli_4', contact_id: '1004', contact_name: 'Dialog Axiata', company_name: 'Dialog Axiata PLC', email: 'enterprise@dialog.lk' },
  { id: 'cli_5', contact_id: '1005', contact_name: 'PWH Logistics', company_name: 'PW Holdings Logistics', email: 'logistics@pwholdings.lk' },
  { id: 'cli_6', contact_id: '1006', contact_name: 'Brandix Apparel', company_name: 'Brandix Lanka Ltd', email: 'contact@brandix.com' }
];

/**
 * Obtain Zoho OAuth Access Token using Refresh Token with in-memory caching.
 */
async function getZohoAccessToken(forceRefresh = false) {
  const accountsUrl = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com').replace(/\/+$/, '');
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho credentials missing in environment variables (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN).');
  }

  const now = Date.now();
  if (!forceRefresh && cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const tokenEndpoint = `${accountsUrl}/oauth/v2/token`;
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });

  const response = await fetch(`${tokenEndpoint}?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Zoho access token (HTTP ${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data || !data.access_token) {
    const errMessage = data?.error || 'No access_token returned by Zoho OAuth endpoint';
    throw new Error(`Zoho token error: ${errMessage}`);
  }

  const expiresInSec = parseInt(data.expires_in || 3600, 10);
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + expiresInSec * 1000;

  return cachedToken;
}

/**
 * Format date string or Date object to YYYY-MM-DD
 */
function formatDate(dateValue) {
  if (!dateValue) return null;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch (err) {
    return null;
  }
}

/**
 * Sync employee profile to Zoho Books API (Contacts / Employees endpoint).
 */
async function syncEmployeeToZohoBooks(employee, isRetry = false) {
  try {
    const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID || process.env.ZOHO_ORGANIZATION_ID;
    if (!orgId) {
      return { success: false, error: 'ZOHO_BOOKS_ORGANIZATION_ID environment variable is missing.' };
    }

    const booksApiUrl = (process.env.ZOHO_BOOKS_API_URL || 'https://www.zohoapis.com/books/v3').replace(/\/+$/, '');
    const token = await getZohoAccessToken(isRetry);

    const name = employee.name || employee.full_name || 
      [employee.first_name, employee.last_name].filter(Boolean).join(' ') || 'Employee';
    
    const corporateEmail = employee.email || employee.corporate_email || employee.personal_email || null;
    const nic = employee.nic || null;
    const designation = employee.designation || null;
    const cardDesignation = employee.card_designation || null;
    const dateJoined = formatDate(employee.date_joined || employee.joined_date);
    const phone = employee.phone || employee.mobile_phone || null;
    const department = employee.department || 'P W Holdings';
    const schoolAttended = employee.school_attended || employee.school || null;
    const tshirtSize = employee.tshirt_size || employee.t_shirt_size || null;

    const booksPayload = {
      contact_name: name,
      company_name: department,
      contact_type: 'employee',
      email: corporateEmail,
      phone: phone,
      notes: `NIC: ${nic || 'N/A'} | Designation: ${designation || 'N/A'} | Card Desig: ${cardDesignation || 'N/A'} | Joined: ${dateJoined || 'N/A'} | School: ${schoolAttended || 'N/A'} | T-Shirt: ${tshirtSize || 'N/A'}`
    };

    const targetUrl = `${booksApiUrl}/contacts?organization_id=${encodeURIComponent(orgId)}`;
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        'X-com-zoho-books-organizationid': orgId
      },
      body: JSON.stringify(booksPayload)
    });

    if (response.status === 401 && !isRetry) {
      cachedToken = null;
      tokenExpiresAt = 0;
      return await syncEmployeeToZohoBooks(employee, true);
    }

    const resultText = await response.text();
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch {
      resultJson = { raw: resultText };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Zoho Books API HTTP ${response.status}: ${JSON.stringify(resultJson)}`
      };
    }

    return {
      success: true,
      service: 'Zoho Books',
      result: resultJson
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || String(err)
    };
  }
}

  /**
   * Create a new employee entry directly in Zoho Books Custom Module 'cm_employee'
   */
  async function createZohoEmployeeRecord(empData = {}) {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const orgId = process.env.ZOHO_ORGANIZATION_ID;

    if (!clientId || !clientSecret || !refreshToken || !orgId) {
      return {
        success: false,
        message: 'Zoho Books API credentials not configured in backend environment.'
      };
    }

    try {
      const now = Date.now();
      // Ensure token is fresh
      if (!cachedToken || now >= tokenExpiresAt) {
        const candidateAccounts = workingAccountsUrl 
          ? [workingAccountsUrl] 
          : [
              process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
              'https://accounts.zoho.in',
              'https://accounts.zoho.eu'
            ];

        let tokenData = null;
        let successfulAccountsUrl = null;

        for (const accountsUrl of candidateAccounts) {
          try {
            const params = new URLSearchParams();
            params.append('refresh_token', refreshToken ? refreshToken.trim() : '');
            params.append('client_id', clientId ? clientId.trim() : '');
            params.append('client_secret', clientSecret ? clientSecret.trim() : '');
            params.append('grant_type', 'refresh_token');

            const tokenRes = await fetch(`${accountsUrl}/oauth/v2/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params
            });

            const resJson = await tokenRes.json();
            if (resJson.access_token) {
              tokenData = resJson;
              successfulAccountsUrl = accountsUrl;
              break;
            }
          } catch (err) {
            console.warn(`Token request failed at ${accountsUrl}:`, err.message);
          }
        }

        if (!tokenData || !tokenData.access_token) {
          return { success: false, message: 'Could not obtain Zoho Books access token.' };
        }

        workingAccountsUrl = successfulAccountsUrl;
        cachedToken = tokenData.access_token;
        tokenExpiresAt = now + ((tokenData.expires_in || 3600) - 300) * 1000;
        workingApiDomain = tokenData.api_domain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
      }

      const apiDomain = workingApiDomain || 'https://www.zohoapis.com';

      // Zoho Books Custom Module 'cm_employee' requires top-level cf_* properties
      const payload = {
        cf_name: empData.name || '',
        cf_email: empData.email || ''
      };

      if (empData.emp_code) {
        payload.cf_emp_code = empData.emp_code;
      }
      if (empData.dob) {
        payload.cf_dob = empData.dob;
      }
      if (empData.date_joined || empData.date_of_joined) {
        payload.cf_date_of_joined = empData.date_joined || empData.date_of_joined;
      }
      if (empData.designation) {
        payload.cf_designation = empData.designation;
      }
      if (empData.card_designation) {
        payload.cf_card_designation = empData.card_designation;
      }
      if (empData.phone) {
        payload.cf_phone = empData.phone;
      }
      if (empData.address) {
        payload.cf_adderss = empData.address;
      }

      const endpoint = `${apiDomain}/books/v3/cm_employee?organization_id=${orgId}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${cachedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();

      if (resData.code === 0 || resData.module_record) {
        const empCode = resData.module_record?.cf_emp_code || resData.module_record?.record_name || '';
        return {
          success: true,
          message: `Employee entry created successfully in Zoho Books! (Assigned EMP CODE: ${empCode || 'Auto-assigned'})`,
          data: resData.module_record
        };
      } else {
        console.warn('Zoho Custom Module creation error:', JSON.stringify(resData));
        return {
          success: false,
          message: resData.message || 'Failed to create employee record in Zoho Books.'
        };
      }
    } catch (err) {
      console.error('Create Zoho employee error:', err.message);
      return { success: false, message: err.message };
    }
  }

/**
 * Sync employee profile to Zoho CRM Custom Module (Upsert on NIC).
 */
async function syncEmployeeToZohoCrm(employee, isRetry = false) {
  try {
    if (!employee) {
      return { success: false, error: 'Employee object is required for Zoho sync' };
    }

    const apiUrl = (process.env.ZOHO_API_URL || 'https://www.zohoapis.com').replace(/\/+$/, '');
    const moduleApiName = process.env.ZOHO_CUSTOM_MODULE_API_NAME;

    if (!moduleApiName) {
      return { success: false, error: 'ZOHO_CUSTOM_MODULE_API_NAME environment variable is not configured' };
    }

    const token = await getZohoAccessToken(isRetry);

    const name = employee.name || employee.full_name || 
      [employee.first_name, employee.last_name].filter(Boolean).join(' ') || 'Employee';
    
    const corporateEmail = employee.email || employee.corporate_email || employee.personal_email || null;
    const nic = employee.nic || null;
    const designation = employee.designation || null;
    const cardDesignation = employee.card_designation || null;
    const dateJoined = formatDate(employee.date_joined || employee.joined_date);
    const phone = employee.phone || employee.mobile_phone || null;
    const schoolAttended = employee.school_attended || employee.school || null;
    const tshirtSize = employee.tshirt_size || employee.t_shirt_size || null;

    const recordPayload = {
      Name: name,
      Corporate_Email: corporateEmail,
      NIC: nic,
      Designation: designation,
      Card_Designation: cardDesignation,
      Date_Joined: dateJoined,
      Phone: phone,
      School_Attended: schoolAttended,
      Tshirt_Size: tshirtSize
    };

    Object.keys(recordPayload).forEach(key => {
      if (recordPayload[key] === undefined) {
        recordPayload[key] = null;
      }
    });

    const upsertUrl = `${apiUrl}/crm/v3/${moduleApiName}/upsert`;
    const requestBody = {
      data: [recordPayload],
      duplicate_check_fields: ['NIC']
    };

    const response = await fetch(upsertUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.status === 401 && !isRetry) {
      cachedToken = null;
      tokenExpiresAt = 0;
      return await syncEmployeeToZohoCrm(employee, true);
    }

    const resultText = await response.text();
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch {
      resultJson = { raw: resultText };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Zoho CRM API HTTP ${response.status}: ${JSON.stringify(resultJson)}`
      };
    }

    return {
      success: true,
      service: 'Zoho CRM',
      result: resultJson
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || String(err)
    };
  }
}

/**
 * Unified Zoho Sync entrypoint.
 */
async function syncEmployeeToZoho(employee) {
  if (!employee) {
    return { success: false, error: 'Employee data required' };
  }

  const results = {};

  if (process.env.ZOHO_BOOKS_ORGANIZATION_ID || process.env.ZOHO_ORGANIZATION_ID) {
    results.books = await syncEmployeeToZohoBooks(employee);
  }

  if (process.env.ZOHO_CUSTOM_MODULE_API_NAME) {
    results.crm = await syncEmployeeToZohoCrm(employee);
  }

  if (!process.env.ZOHO_BOOKS_ORGANIZATION_ID && !process.env.ZOHO_ORGANIZATION_ID && !process.env.ZOHO_CUSTOM_MODULE_API_NAME) {
    return {
      success: false,
      error: 'Neither ZOHO_BOOKS_ORGANIZATION_ID nor ZOHO_CUSTOM_MODULE_API_NAME is configured.'
    };
  }

  const overallSuccess = (results.books?.success !== false) && (results.crm?.success !== false);

  return {
    success: overallSuccess,
    results
  };
}

/**
 * Fetch list of clients from Zoho Books API with pagination (fetching all 200+ clients)
 */
async function getZohoClients() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const orgId = process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_BOOKS_ORGANIZATION_ID;

  const now = Date.now();
  if (cachedClientsData && now < cachedClientsExpiresAt) {
    return cachedClientsData;
  }

  if (!clientId || !clientSecret || !refreshToken || !orgId) {
    return {
      is_live: false,
      message: 'Zoho Books credentials not configured. Showing default client list.',
      clients: DEFAULT_ZOHO_CLIENTS
    };
  }

  try {
    const now = Date.now();
    
    if (!cachedToken || now >= tokenExpiresAt) {
      const candidateAccounts = workingAccountsUrl 
        ? [workingAccountsUrl] 
        : [
            process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
            'https://accounts.zoho.in',
            'https://accounts.zoho.eu'
          ];

      let tokenData = null;
      let successfulAccountsUrl = null;

      for (const accountsUrl of candidateAccounts) {
        try {
          const params = new URLSearchParams();
          params.append('refresh_token', refreshToken ? refreshToken.trim() : '');
          params.append('client_id', clientId ? clientId.trim() : '');
          params.append('client_secret', clientSecret ? clientSecret.trim() : '');
          params.append('grant_type', 'refresh_token');

          const tokenRes = await fetch(`${accountsUrl}/oauth/v2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
          });

          const resJson = await tokenRes.json();
          if (resJson.access_token) {
            tokenData = resJson;
            successfulAccountsUrl = accountsUrl;
            break;
          }
        } catch (err) {
          console.warn(`Token request failed at ${accountsUrl}:`, err.message);
        }
      }

      if (!tokenData || !tokenData.access_token) {
        return { is_live: false, message: 'Invalid token credentials', clients: DEFAULT_ZOHO_CLIENTS };
      }

      workingAccountsUrl = successfulAccountsUrl;
      cachedToken = tokenData.access_token;
      tokenExpiresAt = now + ((tokenData.expires_in || 3600) - 300) * 1000;
      workingApiDomain = tokenData.api_domain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
    }

    const apiDomain = workingApiDomain || 'https://www.zohoapis.com';
    let allContacts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 15) {
      const contactsUrl = `${apiDomain}/books/v3/contacts?filter_by=Status.ActiveCustomers&per_page=200&page=${page}&organization_id=${orgId}`;
      const contactsRes = await fetch(contactsUrl, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${cachedToken}`
        }
      });

      const contactsData = await contactsRes.json();

      if (contactsData.code === 0 && Array.isArray(contactsData.contacts)) {
        allContacts.push(...contactsData.contacts);
        hasMore = contactsData.page_context ? contactsData.page_context.has_more_page : false;
        page++;
      } else {
        if (page === 1) {
          const fallbackUrl = `${apiDomain}/books/v3/contacts?filter_by=Status.All&per_page=200&page=1&organization_id=${orgId}`;
          const fbRes = await fetch(fallbackUrl, {
            headers: { 'Authorization': `Zoho-oauthtoken ${cachedToken}` }
          });
          const fbData = await fbRes.json();
          if (fbData.code === 0 && Array.isArray(fbData.contacts)) {
            allContacts = fbData.contacts;
          }
        }
        hasMore = false;
      }
    }

    if (allContacts.length === 0) {
      return { is_live: true, clients: DEFAULT_ZOHO_CLIENTS };
    }

    const clients = allContacts.map((c) => ({
      id: c.contact_id,
      contact_id: c.contact_id,
      contact_name: c.contact_name || c.company_name || 'Client',
      company_name: c.company_name || c.contact_name || 'Client',
      email: c.email || ''
    }));

    cachedClientsData = {
      is_live: true,
      clients: clients
    };
    cachedClientsExpiresAt = Date.now() + 5 * 60 * 1000; // Cache for 5 mins
    return cachedClientsData;
  } catch (err) {
    console.error('Zoho API Error:', err.message);
    return {
      is_live: false,
      message: err.message,
      clients: DEFAULT_ZOHO_CLIENTS
    };
  }
}

/**
 * Get Client Work Analytics for Admin Reports
 */
async function getClientAnalytics() {
  const now = Date.now();
  if (cachedAnalyticsData && now < cachedAnalyticsExpiresAt) {
    return cachedAnalyticsData;
  }

  const { clients } = await getZohoClients();

  // Decouple daily_work_entries and users to avoid slow nested PostgREST joins that cause statement timeouts
  const [entriesRes, usersRes] = await Promise.all([
    supabase
      .from('daily_work_entries')
      .select('id, user_id, entry_date, work_description, created_at')
      .order('entry_date', { ascending: false })
      .limit(1000),
    supabase
      .from('users')
      .select('id, name, initials, department')
  ]);

  if (entriesRes.error) {
    console.error('Error fetching work entries for client analytics:', entriesRes.error.message);
    throw new Error(entriesRes.error.message);
  }

  const userMap = {};
  (usersRes.data || []).forEach(u => {
    userMap[u.id] = u;
  });

  const entries = (entriesRes.data || []).map(e => ({
    ...e,
    users: userMap[e.user_id] || null
  }));

  const clientStatsMap = {};
  
  (clients || []).forEach((c) => {
    const name = c.contact_name || c.company_name || c.id;
    clientStatsMap[name] = {
      client_name: name,
      company_name: c.company_name || name,
      contact_id: c.contact_id || c.id,
      email: c.email || '',
      total_work_entries: 0,
      unique_employees: new Set(),
      logs: [],
      latest_work_date: ''
    };
  });

  const normalize = (str) => (str || '').toLowerCase().trim();

  const getOrRegisterClientKey = (clientName) => {
    if (!clientName) return null;
    const normInput = normalize(clientName);

    let existingKey = Object.keys(clientStatsMap).find(k => normalize(k) === normInput);
    if (existingKey) return existingKey;

    const matchedZoho = clients.find(c => 
      normalize(c.contact_name) === normInput || 
      normalize(c.company_name) === normInput ||
      normalize(c.contact_name).includes(normInput) ||
      normInput.includes(normalize(c.contact_name))
    );

    if (matchedZoho) {
      const key = matchedZoho.contact_name || matchedZoho.company_name;
      if (clientStatsMap[key]) return key;
    }

    clientStatsMap[clientName] = {
      client_name: clientName,
      company_name: clientName,
      contact_id: 'custom',
      email: '',
      total_work_entries: 0,
      unique_employees: new Set(),
      logs: [],
      latest_work_date: ''
    };
    return clientName;
  };

  (entries || []).forEach((entry) => {
    const empName = entry.users?.name || 'Employee';
    const empDept = entry.users?.department || 'General';
    const empInitials = entry.users?.initials || empName.slice(0, 2).toUpperCase();
    const workDesc = entry.work_description || '';

    const assignedClients = new Set();

    const tagMatch = workDesc.match(/\[Clients:\s*([^\]]+)\]/i);
    if (tagMatch && tagMatch[1]) {
      tagMatch[1].split(',').forEach(s => {
        const trimmed = s.trim();
        if (trimmed) assignedClients.add(trimmed);
      });
    }

    const lowerDesc = normalize(workDesc);
    clients.forEach((c) => {
      const cName = c.contact_name || c.company_name;
      if (!cName) return;
      const normCName = normalize(cName);

      const isGenericWord = ['credit', 'demo', 'support', 'clean', 'system', 'project', 'client', 'manual', 'report'].includes(normCName);
      
      if (!isGenericWord && normCName.length >= 4 && lowerDesc.includes(normCName)) {
        assignedClients.add(cName);
      } else {
        const coreBrandKeywords = [
          'wycherley', 'tekzol', 'slagro', 'helans', 'plexus', 'mgm', 'bio grow', 
          'tranz pharma', 'clevr', 'cleaver', 'italy lanka', 'blue lotus', 'agoal',
          'dilshee', 'mihraj', 'connex', 'vechali', 'vecharly'
        ];
        for (const brand of coreBrandKeywords) {
          if (normCName.includes(brand) && lowerDesc.includes(brand)) {
            assignedClients.add(cName);
            break;
          }
        }
      }
    });

    assignedClients.forEach((clientName) => {
      const targetKey = getOrRegisterClientKey(clientName);
      if (!targetKey || !clientStatsMap[targetKey]) return;

      const stat = clientStatsMap[targetKey];
      stat.total_work_entries += 1;
      stat.unique_employees.add(empName);
      if (!stat.latest_work_date || entry.entry_date > stat.latest_work_date) {
        stat.latest_work_date = entry.entry_date;
      }

      stat.logs.push({
        id: entry.id,
        user_id: entry.user_id,
        employee_name: empName,
        department: empDept,
        initials: empInitials,
        entry_date: entry.entry_date,
        work_description: entry.work_description
      });
    });
  });

  const clientAnalyticsList = Object.values(clientStatsMap).map((stat) => ({
    client_name: stat.client_name,
    company_name: stat.company_name,
    contact_id: stat.contact_id,
    email: stat.email,
    total_work_entries: stat.total_work_entries,
    total_employees_count: stat.unique_employees.size,
    employees: Array.from(stat.unique_employees),
    latest_work_date: stat.latest_work_date,
    logs: stat.logs
  })).sort((a, b) => b.total_work_entries - a.total_work_entries);

  const result = {
    total_clients: clients.length,
    active_clients_worked: clientAnalyticsList.filter(c => c.total_work_entries > 0).length,
    analytics: clientAnalyticsList
  };
  cachedAnalyticsData = result;
  cachedAnalyticsExpiresAt = Date.now() + 60 * 1000;
  return result;
}

/**
 * Retrieve Zoho Books Employee Custom Module ('cm_employee') record by Email
 */
async function getZohoEmployeeByEmail(email) {
  if (!email) return null;
  const targetEmail = email.trim().toLowerCase();
  const token = await getZohoAccessToken();
  const orgId = process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_BOOKS_ORGANIZATION_ID;
  const apiDomain = workingApiDomain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';

  let page = 1;
  let hasMore = true;
  let matchedSummary = null;

  while (hasMore && page <= 5) {
    const url = `${apiDomain}/books/v3/cm_employee?organization_id=${orgId}&page=${page}&per_page=200`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });
    const data = await res.json();
    if (data.code === 0 && Array.isArray(data.module_records)) {
      matchedSummary = data.module_records.find(r => 
        (r.cf_email || '').trim().toLowerCase() === targetEmail
      );
      if (matchedSummary) break;
      hasMore = data.page_context ? data.page_context.has_more_page : false;
      page++;
    } else {
      break;
    }
  }

  if (!matchedSummary) {
    return null;
  }

  // Fetch full details of the employee record by module_record_id to get all custom field attachments & layout values
  const detailUrl = `${apiDomain}/books/v3/cm_employee/${matchedSummary.module_record_id}?organization_id=${orgId}`;
  const detailRes = await fetch(detailUrl, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
  });
  const detailData = await detailRes.json();
  const record = detailData.module_record_hash || detailData.module_record || matchedSummary;

  return {
    module_record_id: matchedSummary.module_record_id,
    emp_code: record.cf_emp_code || '',
    name: record.cf_name || '',
    dob: record.cf_dob || '',
    date_joined: record.cf_date_of_joined || '',
    designation: record.cf_designation || '',
    card_designation: record.cf_card_designation || '',
    email: record.cf_email || '',
    phone: record.cf_phone || '',
    address: record.cf_adderss || '',
    documents: {
      nic: record.cf_attachment ? {
        document_id: record.cf_attachment,
        file_name: record.cf_attachment_formatted || 'Copy of NIC',
        doc_type: 'nic',
        label: 'Copy of NIC'
      } : null,
      ol_certificate: record.cf_attachment_2 ? {
        document_id: record.cf_attachment_2,
        file_name: record.cf_attachment_2_formatted || 'Educational Certificate (O/L)',
        doc_type: 'ol_certificate',
        label: 'Educational Certificates (O/L)'
      } : null,
      al_certificate: record.cf_attachment_3 ? {
        document_id: record.cf_attachment_3,
        file_name: record.cf_attachment_3_formatted || 'Educational Certificate (A/L)',
        doc_type: 'al_certificate',
        label: 'Educational Certificates (A/L)'
      } : null,
      other_certificate: record.cf_attachment_4 ? {
        document_id: record.cf_attachment_4,
        file_name: record.cf_attachment_4_formatted || 'Other Qualification Certificate',
        doc_type: 'other_certificate',
        label: 'Other Qualification Certificates'
      } : null
    },
    raw: record
  };
}

/**
 * Update an existing Zoho Books Employee Custom Module record by Email
 */
async function updateZohoEmployeeRecord(email, updates = {}) {
  if (!email) {
    return { success: false, message: 'Email is required' };
  }
  const token = await getZohoAccessToken();
  const orgId = process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_BOOKS_ORGANIZATION_ID;
  const apiDomain = workingApiDomain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';

  let existing = await getZohoEmployeeByEmail(email);
  if (!existing) {
    return await createZohoEmployeeRecord({
      ...updates,
      email: email
    });
  }

  const payload = {};
  if (updates.name !== undefined) payload.cf_name = updates.name;
  if (updates.emp_code !== undefined && updates.emp_code) payload.cf_emp_code = updates.emp_code;
  if (updates.dob !== undefined) payload.cf_dob = updates.dob;
  if (updates.date_joined !== undefined || updates.date_of_joined !== undefined || updates.joined_date !== undefined) {
    payload.cf_date_of_joined = updates.date_joined || updates.date_of_joined || updates.joined_date;
  }
  if (updates.designation !== undefined) payload.cf_designation = updates.designation;
  if (updates.card_designation !== undefined) payload.cf_card_designation = updates.card_designation;
  if (updates.phone !== undefined) payload.cf_phone = updates.phone;
  if (updates.address !== undefined) payload.cf_adderss = updates.address;

  const endpoint = `${apiDomain}/books/v3/cm_employee/${existing.module_record_id}?organization_id=${orgId}`;
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const resData = await res.json();
  if (resData.code === 0 || resData.module_record) {
    return {
      success: true,
      message: 'Zoho Books employee updated successfully',
      data: resData.module_record
    };
  } else {
    return {
      success: false,
      message: resData.message || 'Failed to update Zoho Books employee'
    };
  }
}

/**
 * Upload a document directly to Zoho Books custom module record and associate with custom field
 * docType: 'nic' | 'ol_certificate' | 'al_certificate' | 'other_certificate'
 */
async function uploadZohoEmployeeDocument(email, docType, fileBuffer, fileName, mimeType) {
  if (!email || !docType || !fileBuffer) {
    throw new Error('Email, docType, and file data are required');
  }

  const fieldMap = {
    nic: 'cf_attachment',
    ol_certificate: 'cf_attachment_2',
    al_certificate: 'cf_attachment_3',
    other_certificate: 'cf_attachment_4'
  };

  const targetField = fieldMap[docType];
  if (!targetField) {
    throw new Error(`Invalid docType: ${docType}. Must be one of: nic, ol_certificate, al_certificate, other_certificate`);
  }

  const token = await getZohoAccessToken();
  const orgId = process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_BOOKS_ORGANIZATION_ID;
  const apiDomain = workingApiDomain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';

  let existing = await getZohoEmployeeByEmail(email);
  if (!existing) {
    const createRes = await createZohoEmployeeRecord({ email });
    if (!createRes.success || !createRes.data) {
      throw new Error(`Failed to create employee in Zoho Books: ${createRes.message}`);
    }
    existing = { module_record_id: createRes.data.module_record_id };
  }

  const recordId = existing.module_record_id;

  // 1. Upload attachment to Zoho Books
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType || 'application/octet-stream' });
  formData.append('attachment', blob, fileName);

  const attachUrl = `${apiDomain}/books/v3/cm_employee/${recordId}/attachment?organization_id=${orgId}`;
  const attachRes = await fetch(attachUrl, {
    method: 'POST',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    body: formData
  });

  const attachData = await attachRes.json();
  if (attachData.code !== 0 || !Array.isArray(attachData.documents) || attachData.documents.length === 0) {
    throw new Error(attachData.message || 'Failed to upload attachment to Zoho Books');
  }

  const uploadedDoc = attachData.documents[0];
  const documentId = uploadedDoc.document_id;

  // 2. Associate the document_id with the corresponding custom field
  const putUrl = `${apiDomain}/books/v3/cm_employee/${recordId}?organization_id=${orgId}`;
  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      [targetField]: documentId
    })
  });

  const putData = await putRes.json();
  if (putData.code !== 0) {
    console.warn(`Attached document ${documentId} but field association returned:`, putData.message);
  }

  return {
    success: true,
    document_id: documentId,
    file_name: uploadedDoc.file_name || fileName,
    file_size: uploadedDoc.file_size,
    doc_type: docType,
    field_name: targetField,
    zoho_record_id: recordId
  };
}

/**
 * Remove document from a custom field in Zoho Books
 */
async function deleteZohoEmployeeDocument(email, docType) {
  const fieldMap = {
    nic: 'cf_attachment',
    ol_certificate: 'cf_attachment_2',
    al_certificate: 'cf_attachment_3',
    other_certificate: 'cf_attachment_4'
  };

  const targetField = fieldMap[docType];
  if (!targetField) throw new Error(`Invalid docType: ${docType}`);

  const existing = await getZohoEmployeeByEmail(email);
  if (!existing) return { success: true };

  const token = await getZohoAccessToken();
  const orgId = process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_BOOKS_ORGANIZATION_ID;
  const apiDomain = workingApiDomain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';

  const putUrl = `${apiDomain}/books/v3/cm_employee/${existing.module_record_id}?organization_id=${orgId}`;
  await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      [targetField]: ''
    })
  });

  return { success: true };
}

/**
 * Fetch document stream/buffer from Zoho Books documents endpoint
 */
async function getZohoDocument(documentId) {
  if (!documentId) throw new Error('Document ID is required');
  const token = await getZohoAccessToken();
  const orgId = process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_BOOKS_ORGANIZATION_ID;
  const apiDomain = workingApiDomain || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';

  const url = `${apiDomain}/books/v3/documents/${documentId}?organization_id=${orgId}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to download Zoho document (HTTP ${res.status})`);
  }

  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType
  };
}

/**
 * Sync Zoho Books custom module data into local Supabase user profile
 */
async function syncZohoEmployeeToLocalProfile(userId) {
  if (!userId) throw new Error('User ID required');

  // 1. Get local user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userErr || !user) {
    throw new Error('Local user profile not found');
  }

  const email = user.email;
  if (!email) {
    return { success: false, message: 'User has no email address configured' };
  }

  // 2. Fetch Zoho Books employee
  const zohoEmp = await getZohoEmployeeByEmail(email);
  if (!zohoEmp) {
    return {
      success: false,
      message: `No matching employee found in Zoho Books with email "${email}"`,
      matched: false
    };
  }

  // 3. Prepare payload from Zoho Books fields to update local user
  const updatePayload = {};
  if (zohoEmp.emp_code && !user.emp_code) {
    updatePayload.emp_code = zohoEmp.emp_code;
  }
  if (zohoEmp.dob) {
    updatePayload.dob = zohoEmp.dob.split('T')[0];
  }
  if (zohoEmp.date_joined) {
    updatePayload.date_joined = zohoEmp.date_joined.split('T')[0];
  }
  if (zohoEmp.designation) {
    updatePayload.designation = zohoEmp.designation;
  }
  if (zohoEmp.card_designation) {
    updatePayload.card_designation = zohoEmp.card_designation;
  }
  if (zohoEmp.phone && !user.phone) {
    updatePayload.phone = zohoEmp.phone;
  }
  if (zohoEmp.address && !user.address) {
    updatePayload.address = zohoEmp.address;
  }

  if (Object.keys(updatePayload).length > 0) {
    await supabase.from('users').update(updatePayload).eq('id', userId);
  }

  const { data: updatedUser } = await supabase
    .from('users')
    .select('id, emp_code, designation, card_designation, employment_type, dob, gender, nic, address, phone, personal_email, school_attended, tshirt_size, date_joined, photo_url, department, status, role, email, name, initials')
    .eq('id', userId)
    .single();

  return {
    success: true,
    matched: true,
    zoho_data: zohoEmp,
    updated_profile: updatedUser || user
  };
}

module.exports = {
  getZohoAccessToken,
  createZohoEmployeeRecord,
  getZohoEmployeeByEmail,
  updateZohoEmployeeRecord,
  uploadZohoEmployeeDocument,
  deleteZohoEmployeeDocument,
  getZohoDocument,
  syncZohoEmployeeToLocalProfile,
  syncEmployeeToZohoBooks,
  syncEmployeeToZohoCrm,
  syncEmployeeToZoho,
  getZohoClients,
  getClientAnalytics
};

