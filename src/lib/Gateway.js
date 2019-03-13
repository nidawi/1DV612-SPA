// Gateway access wrapper
const gatewayUrl = 'https://1dv612-gateway.nidawi.me';

const request = (url, config) => {
  return new Promise((resolve, reject) => {
    fetch(`${gatewayUrl}/${url}`, {
      method: (config && config.method ? config.method : undefined) || 'GET',
      body: (config && config.body ? JSON.stringify(config.body) : undefined),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': (config && config.auth) ? `bearer ${config.auth}` : undefined 
      }
    })
    .then(res => {
      if ([201, 204].indexOf(res.status) > -1) resolve(res);
      else return res.json();
    })
    .then(res => {
      if (res.code) reject(new Error(res.message));
      else resolve(res);
    })
    .catch(err => reject(err));
  })
}

export function getAccount(token) {
  return request(`github/user`, {
    auth: token
  })
}

export function getAccountEmail(username, token) {
  return request(`accounts/${username}/contacts`, {
    auth: token
  })
    .then(res => res.find(a => a.type === 'email'))
    .then(res => res.value)
    .catch(() => undefined);
}
export function getAccountPushSubscription(username, token) {
  return request(`accounts/${username}/contacts`, {
    auth: token
  })
    .then(res => res.find(a => a.type === 'push'))
    .then(res => res.value)
    .catch(() => undefined);
}

export function addAccountPushSubscription(username, token, push) {
  return request(`accounts/${username}/contacts`, {
    method: 'POST',
    auth: token,
    body: [{
      type: 'push',
      value: JSON.stringify(push)
    }]
  });
}
export function updateAccountPushSubscription(username, token, push) {
  return request(`accounts/${username}/contacts/push`, {
    method: 'PATCH',
    auth: token,
    body: {
      value: JSON.stringify(push)
    }
  });
}
export function deleteAccountPushSubscription(username, token) {
  return request(`accounts/${username}/contacts/push`, {
    method: 'DELETE',
    auth: token
  });
}

export function setAccountEmail(username, token, email) {
  return getAccountEmail(username, token)
    .then(res => {
      if (res) {
        // User has an email registered.
        if (email) return updateAccountEmail(username, token, email); // User wants to update.
        else return deleteAccountEmail(username, token); // user wants to update.
      } else if (email) return addAccountEmail(username, token, email); // User wants to add
    });
}

function addAccountEmail(username, token, email) {
  return request(`accounts/${username}/contacts`, {
    method: 'POST',
    auth: token,
    body: [{
      type: 'email',
      value: email
    }]
  });
}
function updateAccountEmail(username, token, newEmail) {
  return request(`accounts/${username}/contacts/email`, {
    method: 'PATCH',
    auth: token,
    body: {
      value: newEmail
    }
  });
}
function deleteAccountEmail(username, token) {
  return request(`accounts/${username}/contacts/email`, {
    method: 'DELETE',
    auth: token
  });
}

export function getAccountItems(username, token) {
  return request(`accounts/${username}/items`, {
    auth: token
  })
    .then(res => res.map(a => a.data))
    .catch(() => []);
}

export function getAccountSettings(username, token) {
  return request(`accounts/${username}/settings`, {
    auth: token
  })
    .catch(() => []);
}

/**
 * Updates account settings with the specified values.
 * @export
 * @param {string} username
 * @param {string} token
 * @param {object} updates
 * @param {boolean} [updates.issues_enabled]
 * @param {boolean} [updates.issue_comment_enabled]
 * @param {boolean} [updates.organization_enabled]
 * @param {boolean} [updates.push_enabled]
 * @param {boolean} [updates.release_enabled]
 * @param {boolean} [updates.repository_enabled]
 * @returns
 */
export function updateAccountSettings(username, orgCode, token, updates) {
  return request(`accounts/${username}/settings/${orgCode}`, {
    method: 'PATCH',
    auth: token,
    body: updates
  })
}

export function getOrganizations(token) {
  return request(`github/user/orgs`, {
    auth: token
  })
}

export function addOrgHook(orgCode, token) {
  return request(`github/user/orgs/${orgCode}/hook`, {
    method: 'POST',
    auth: token
  })
}
export function deleteOrgHook(orgCode, token) {
  return request(`github/user/orgs/${orgCode}/hook`, {
    method: 'DELETE',
    auth: token
  })
}

export function registerAccount(username, password) {
  return request('public/account', {
    method: 'POST',
    body: {
      username: username,
      password: password
    }
  })
}

export function authenticateAccount(username, password) {
  return request('public/token', {
    method: 'POST',
    body: {
      username: username,
      password: password
    }
  })
}

export function initiateGithubAuthentication(account) {
  return request(`public/authenticate?account=${account}`);
}
