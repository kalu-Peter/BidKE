/*
Integration test: full flow
- Logs in as seller (credentials must exist in DB)
- Creates an auction (draft)
- Logs in as admin
- Approves the auction
- Makes the auction live
- Fetches /auctions.php?status=live and checks the auction appears

Usage: node tools/integration/full_flow_test.js
Make sure the API server is running at http://localhost:8000 and DB seeded with test users.
*/

const fetch = global.fetch || require('node-fetch');

const API_BASE = 'http://localhost:8000';

async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!data.success) throw new Error('Login failed: ' + JSON.stringify(data));
  return data.data.token;
}

async function createAuction(token, payload) {
  const res = await fetch(`${API_BASE}/auctions/create.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function adminAction(token, auctionId, action, extra = {}) {
  const res = await fetch(`${API_BASE}/admin/listings.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ auction_id: auctionId, action, ...extra })
  });
  return res.json();
}

async function fetchLiveAuctions() {
  const res = await fetch(`${API_BASE}/auctions.php?status=live&page=1&limit=20`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

(async () => {
  try {
    console.log('Logging in as seller...');
    const sellerToken = await login('seller_test', 'seller_password'); // Replace with real test seller

    console.log('Creating auction as draft...');
    const now = new Date();
    const startDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // +1 day

    const createResp = await createAuction(sellerToken, {
      itemType: 'electronic',
      title: 'Integration Test Item ' + Date.now(),
      description: 'Test description',
      startingPrice: 10000,
      auctionStartDate: startDate.toISOString().slice(0,10),
      auctionStartTime: startDate.toTimeString().slice(0,5),
      auctionEndDate: endDate.toISOString().slice(0,10),
      auctionEndTime: endDate.toTimeString().slice(0,5),
      electronicsBrand: 'TestBrand',
      electronicsModel: 'T-1000',
      electronicsYear: '2024',
      electronicsCondition: 'excellent',
      status: 'draft'
    });

    if (!createResp.success) {
      console.error('Failed to create auction:', createResp);
      process.exit(1);
    }

    const auctionId = createResp.data.auction_id;
    console.log('Created auction with id:', auctionId);

    console.log('Logging in as admin...');
    const adminToken = await login('admin_test', 'admin_password'); // Replace with real admin

    console.log('Approving auction...');
    const approveResp = await adminAction(adminToken, auctionId, 'approve');
    console.log('Approve response:', approveResp);

    console.log('Making auction live...');
    const liveResp = await adminAction(adminToken, auctionId, 'make_live');
    console.log('Make live response:', liveResp);

    console.log('Fetching live auctions...');
    const liveList = await fetchLiveAuctions();
    if (!liveList.success) {
      console.error('Failed to fetch live auctions:', liveList);
      process.exit(1);
    }

    const found = (liveList.data || []).some(a => parseInt(a.id) === parseInt(auctionId));
    if (found) {
      console.log('Integration test success: auction is live and visible in browse list');
      process.exit(0);
    } else {
      console.error('Integration test failed: auction not found in live list');
      process.exit(2);
    }

  } catch (err) {
    console.error('Integration test error:', err);
    process.exit(3);
  }
})();
