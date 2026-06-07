import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBW9uHdIYhRtI_soxh4kZmEc-c3GuDjwBM",
  authDomain: "monitoring-pembayaran-up2kps.firebaseapp.com",
  projectId: "monitoring-pembayaran-up2kps",
  storageBucket: "monitoring-pembayaran-up2kps.firebasestorage.app",
  messagingSenderId: "858366238783",
  appId: "1:858366238783:web:417f26d52e56ac6729988a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tagihanRef = collection(db, "monitoringTagihan");

const users = [
  { username: "admin", password: "admin123", role: "Administrator" },
  { username: "manager", password: "manager123", role: "Manager" },
  { username: "operator", password: "operator123", role: "Operator" }
];

let editId = null;
let data = [];

const form = document.getElementById("formTagihan");
const tabel = document.getElementById("tabelTagihan");
const search = document.getElementById("search");
const filterStatus = document.getElementById("filterStatus");
const submitBtn = document.getElementById("submitBtn");

function getCurrentUser(){
  return JSON.parse(sessionStorage.getItem("monitoringUser") || "null");
}

function showApp(){
  const user = getCurrentUser();
  const loginScreen = document.getElementById("loginScreen");
  const appShell = document.getElementById("appShell");
  if(user){
    loginScreen.style.display = "none";
    appShell.classList.add("show");
    document.getElementById("userInfo").textContent = `${user.username} - ${user.role}`;
  } else {
    loginScreen.style.display = "grid";
    appShell.classList.remove("show");
  }
}

function logout(){
  sessionStorage.removeItem("monitoringUser");
  showApp();
}

function rupiah(v){
  return new Intl.NumberFormat("id-ID",{
    style:"currency",
    currency:"IDR",
    maximumFractionDigits:0
  }).format(Number(v || 0));
}

function hariIni(){
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
}

function selisihHari(tanggal){
  if(!tanggal) return "-";
  const a = new Date(tanggal);
  a.setHours(0,0,0,0);
  if(Number.isNaN(a.getTime())) return "-";
  return Math.max(0, Math.floor((hariIni() - a) / (1000*60*60*24)));
}

function isTerlambat(item){
  if(item.status === "Selesai dibayar") return false;
  if(!item.targetBayar) return false;
  const target = new Date(item.targetBayar);
  target.setHours(0,0,0,0);
  if(Number.isNaN(target.getTime())) return false;
  return hariIni() > target;
}

function statusBadge(status){
  if(status === "Selesai dibayar") return "green";
  if(status === "Revisi vendor") return "orange";
  if(status === "Pengajuan pembayaran" || status === "Approval manajemen") return "yellow";
  if(status === "Verifikasi dokumen") return "blue";
  return "gray";
}

function getFormData(){
  const user = getCurrentUser();
  return {
    namaPekerjaan: document.getElementById("namaPekerjaan").value.trim(),
    lokasi: document.getElementById("lokasi").value.trim(),
    vendor: document.getElementById("vendor").value.trim(),
    nomorKontrak: document.getElementById("nomorKontrak").value.trim(),
    nilaiKontrak: Number(document.getElementById("nilaiKontrak").value || 0),
    nilaiTagihan: Number(document.getElementById("nilaiTagihan").value || 0),
    nomorInvoice: document.getElementById("nomorInvoice").value.trim(),
    tanggalInvoice: document.getElementById("tanggalInvoice").value,
    tanggalMasuk: document.getElementById("tanggalMasuk").value,
    targetBayar: document.getElementById("targetBayar").value,
    pic: document.getElementById("pic").value.trim(),
    status: document.getElementById("status").value,
    catatan: document.getElementById("catatan").value.trim(),
    updatedBy: user ? user.username : "unknown",
    updatedAt: serverTimestamp()
  };
}

function setFormData(item){
  for(const key in item){
    const el = document.getElementById(key);
    if(el) el.value = item[key] ?? "";
  }
}

async function handleSubmit(e){
  e.preventDefault();
  const item = getFormData();

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = editId ? "Mengupdate..." : "Menyimpan...";

    if(editId){
      await updateDoc(doc(db, "monitoringTagihan", editId), item);
    } else {
      await addDoc(tagihanRef, {
        ...item,
        createdAt: serverTimestamp()
      });
    }

    resetForm();
  } catch (error) {
    console.error(error);
    alert("Data gagal disimpan. Cek koneksi internet dan Rules Firestore.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Simpan Data";
  }
}

function resetForm(){
  form.reset();
  editId = null;
  submitBtn.textContent = "Simpan Data";
}

function editData(id){
  const item = data.find(x => x.id === id);
  if(!item) return;
  editId = id;
  setFormData(item);
  submitBtn.textContent = "Update Data";
  location.hash = "#input";
}

async function hapusData(id){
  if(!confirm("Yakin ingin menghapus data tagihan ini?")) return;
  try {
    await deleteDoc(doc(db, "monitoringTagihan", id));
  } catch (error) {
    console.error(error);
    alert("Data gagal dihapus. Cek koneksi internet dan Rules Firestore.");
  }
}

async function naikStatus(id){
  const urutan = ["Dokumen diterima","Verifikasi dokumen","Revisi vendor","Approval manajemen","Pengajuan pembayaran","Selesai dibayar"];
  const item = data.find(x => x.id === id);
  if(!item) return;
  const posisi = urutan.indexOf(item.status);
  const statusBaru = urutan[(posisi + 1) % urutan.length];
  const user = getCurrentUser();

  try {
    await updateDoc(doc(db, "monitoringTagihan", id), {
      status: statusBaru,
      updatedBy: user ? user.username : "unknown",
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(error);
    alert("Status gagal diupdate. Cek koneksi internet dan Rules Firestore.");
  }
}

function render(){
  const keyword = (search?.value || "").toLowerCase();
  const statusFilter = filterStatus?.value || "";

  const filtered = data.filter(item => {
    const cocokKeyword = Object.values(item).join(" ").toLowerCase().includes(keyword);
    const cocokStatus = statusFilter === "" || item.status === statusFilter;
    return cocokKeyword && cocokStatus;
  });

  tabel.innerHTML = "";

  if(filtered.length === 0){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="13">Belum ada data monitoring. Silakan input data tagihan/kontrak.</td>`;
    tabel.appendChild(tr);
  }

  filtered.forEach(item => {
    const terlambat = isTerlambat(item);
    const slaClass = item.status === "Selesai dibayar" ? "green" : terlambat ? "red" : "yellow";
    const slaText = item.status === "Selesai dibayar" ? "Selesai" : terlambat ? "Terlambat" : "On Progress";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.namaPekerjaan || "-"}</td>
      <td>${item.vendor || "-"}</td>
      <td>${item.nomorKontrak || "-"}</td>
      <td>${item.nomorInvoice || "-"}</td>
      <td>${rupiah(item.nilaiTagihan)}</td>
      <td>${item.tanggalMasuk || "-"}</td>
      <td>${item.targetBayar || "-"}</td>
      <td>${selisihHari(item.tanggalMasuk)} hari</td>
      <td><span class="badge ${statusBadge(item.status)}">${item.status || "-"}</span></td>
      <td><span class="badge ${slaClass}">${slaText}</span></td>
      <td>${item.pic || "-"}</td>
      <td>${item.catatan || "-"}</td>
      <td class="action-cell">
        <button onclick="naikStatus('${item.id}')">Status</button>
        <button class="secondary" onclick="editData('${item.id}')">Edit</button>
        <button class="danger" onclick="hapusData('${item.id}')">Hapus</button>
      </td>
    `;
    tabel.appendChild(tr);
  });

  document.getElementById("totalTagihan").textContent = data.length;
  document.getElementById("dalamProses").textContent = data.filter(x => x.status !== "Selesai dibayar").length;
  document.getElementById("terlambat").textContent = data.filter(x => isTerlambat(x)).length;
  document.getElementById("selesai").textContent = data.filter(x => x.status === "Selesai dibayar").length;
  document.getElementById("totalNilai").textContent = rupiah(data.reduce((s,x)=>s+Number(x.nilaiTagihan||0),0));
}

function exportCSV(){
  const headers = ["Nama Pekerjaan","Lokasi","Vendor","Nomor Kontrak","Nilai Kontrak","Nilai Tagihan","Nomor Invoice","Tanggal Invoice","Tanggal Masuk","Target Bayar","PIC","Status","Catatan"];
  const rows = data.map(x => [
    x.namaPekerjaan,x.lokasi,x.vendor,x.nomorKontrak,x.nilaiKontrak,x.nilaiTagihan,x.nomorInvoice,x.tanggalInvoice,x.tanggalMasuk,x.targetBayar,x.pic,x.status,x.catatan
  ]);

  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "monitoring_pembayaran_tagihan.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function startRealtimeListener(){
  try {
    const q = query(tagihanRef, orderBy("createdAt", "desc"));
    onSnapshot(q, snapshot => {
      data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }, error => {
      console.error(error);
      alert("Gagal membaca data Firebase. Pastikan Firestore Rules masih test mode dan internet aktif.");
    });
  } catch (error) {
    console.error(error);
    alert("Firebase belum berhasil terhubung. Periksa konfigurasi Firebase di script.js.");
  }
}

function setupLogin(){
  const loginForm = document.getElementById("loginForm");
  loginForm.addEventListener("submit", function(e){
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const found = users.find(u => u.username === username && u.password === password);
    if(found){
      sessionStorage.setItem("monitoringUser", JSON.stringify({ username: found.username, role: found.role }));
      document.getElementById("loginPassword").value = "";
      document.getElementById("loginError").textContent = "";
      showApp();
    } else {
      document.getElementById("loginError").textContent = "Username atau password salah.";
    }
  });
  showApp();
}

form.addEventListener("submit", handleSubmit);
search.addEventListener("input", render);
filterStatus.addEventListener("change", render);

window.logout = logout;
window.resetForm = resetForm;
window.editData = editData;
window.hapusData = hapusData;
window.naikStatus = naikStatus;
window.exportCSV = exportCSV;

setupLogin();
startRealtimeListener();
