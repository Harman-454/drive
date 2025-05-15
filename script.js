// Configuration
const SUPABASE_URL      = 'https://mqrdlpzavmsrpsvlmeab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcmRscHphdm1zcnBzdmxtZWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjAzNTEsImV4cCI6MjA2Mjg5NjM1MX0.O-u9dnFWKS_dqgnbfcZjDdm2P1iKbCCppTIjxg1-5bY';
const UPLD_EMAIL        = 'harman.marwah454@gmail.com';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const bucket           = 'drive';

// DOM refs
const loginCard       = document.getElementById('loginCard');
const uploadCard      = document.getElementById('uploadCard');
const loginBtn        = document.getElementById('loginBtn');
const pwInput         = document.getElementById('password');
const loginError      = document.getElementById('loginError');
const fileInput       = document.getElementById('fileInput');
const uploadBtnEl     = document.getElementById('uploadBtn');
const uploadArea      = document.getElementById('uploadArea');
const uploadProgress  = document.getElementById('uploadProgress');
const uploadStatus    = document.getElementById('uploadStatus');
const fileListDiv     = document.getElementById('fileList');
const noFilesP        = document.getElementById('noFiles');

// Handle Sign‑In
loginBtn.addEventListener('click', async () => {
  loginError.textContent = '';
  const password = pwInput.value.trim();
  if (!password) {
    loginError.textContent = 'Please enter the password.';
    return;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email: UPLD_EMAIL, password });
  if (error) {
    loginError.textContent = error.message;
    return;
  }
  loginCard.classList.add('hidden');
  uploadCard.classList.remove('hidden');
  setupUploadArea();
  await listFiles();
});

// Setup upload area
function setupUploadArea() {
  uploadBtnEl.onclick = () => fileInput.click();
  fileInput.onchange = () => fileInput.files.length && handleUpload(fileInput.files[0]);
  ['dragover','dragleave','drop'].forEach(evt => {
    uploadArea.addEventListener(evt, e => {
      e.preventDefault();
      uploadArea.classList.toggle('highlight', evt === 'dragover');
    });
  });
  uploadArea.addEventListener('drop', e => {
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files[0]);
  });
}

// Upload file
async function handleUpload(file) {
  uploadProgress.style.display = 'block';
  noFilesP.style.display = 'none';
  const path = `${Date.now()}_${file.name}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) alert('Upload error: ' + error.message);
  uploadProgress.style.display = 'none';
  await listFiles();
}

// Delete file
async function handleDelete(fileName) {
  if (!confirm(`Really delete "${fileName}"?`)) return;
  const { error } = await supabaseClient.storage.from(bucket).remove([fileName]);
  if (error) alert('Delete error: ' + error.message);
  else await listFiles();
}

// List files & usage with buttons
async function listFiles() {
  fileListDiv.innerHTML = '';
  noFilesP.style.display = 'none';

  const { data: files, error: listError } = await supabaseClient.storage.from(bucket).list('', { limit: 100 });
  if (listError) { alert('Could not list files: ' + listError.message); return; }
  if (!files.length) { noFilesP.style.display = 'block'; return; }

  for (const f of files) {
    const { data: urlData, error: urlError } = await supabaseClient.storage.from(bucket).createSignedUrl(f.name, 60);
    const downloadUrl = urlData?.signedUrl || '#';
    const disabledDownload = urlData ? '' : 'onclick="alert(\'Download not available\'); return false;"';

    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <span>${f.name}</span>
      <div class="file-actions">
        <a href="${downloadUrl}" target="_blank" class="btn" ${disabledDownload}>Download</a>
        <button class="delete-btn" onclick="handleDelete('${f.name.replace(/'/g, "\\'")}')">Delete</button>
      </div>`;
    fileListDiv.appendChild(div);
  }
}
