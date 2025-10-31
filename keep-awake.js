// Script to ping health check endpoints to keep services awake
// Can be run as a cron job or manually

const BACKEND_URL = process.env.BACKEND_URL || 'https://music-space-server.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://music-space-frontend.onrender.com';

async function pingBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    console.log(`✅ Backend pinged: ${response.status} -`, data);
    return true;
  } catch (error) {
    console.error('❌ Backend ping failed:', error.message);
    return false;
  }
}

async function pingFrontend() {
  try {
    const response = await fetch(FRONTEND_URL);
    console.log(`✅ Frontend pinged: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ Frontend ping failed:', error.message);
    return false;
  }
}

async function keepAwake() {
  console.log('🔄 Pinging services to keep them awake...');
  const backendOk = await pingBackend();
  const frontendOk = await pingFrontend();
  
  if (backendOk && frontendOk) {
    console.log('✅ All services are awake!');
    process.exit(0);
  } else {
    console.log('⚠️ Some services failed to respond');
    process.exit(1);
  }
}

keepAwake();

