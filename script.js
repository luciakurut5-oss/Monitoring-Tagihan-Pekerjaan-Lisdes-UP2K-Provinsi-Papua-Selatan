
const users = [
  { username: "admin", password: "admin123", role: "Administrator" },
  { username: "manager", password: "manager123", role: "Manager" },
  { username: "operator", password: "operator123", role: "Operator" }
];

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

document.addEventListener("DOMContentLoaded", function(){
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
});

let editIndex = null;

let data = JSON.parse(localStorage.getItem("monitoringPembayaran")) || [
  {
    namaPekerjaan:"Pemeliharaan jaringan distribusi",
    lokasi:"Merauke",
    vendor:"PT Contoh Energi",
    nomorKontrak:"SPK-001/2026",
    nilaiKontrak:500000000,
    nilaiTagihan:125000000,
    nomorInvoice:"INV-001/VI/2026",
    tanggalInvoice:"2026-06-01",
    tanggalMasuk:"2026-06-03",
    targetBayar:"2026-06-20",
    pic:"Admin Teknik",
    status:"Verifikasi dokumen",
    catatan:"Menunggu pengecekan dokumen pendukung."
  },
  {
    namaPekerjaan:"Pekerjaan rutin operasional",
    lokasi:"Mappi",
    vendor:"CV Sinar Papua",
    nomorKontrak:"SPK-002/2026",
    nilaiKontrak:250000000,
    nilaiTagihan:75000000,
    nomorInvoice:"INV-002/VI/2026",
    tanggalInvoice:"2026-05-25",
    tanggalMasuk:"2026-05-27",
    targetBayar:"2026-06-05",
    pic:"Keuangan",
    status:"Pengajuan pembayaran",
    catatan:"Sudah diajukan ke pembayaran."
  }
];

const form = document.getElementById("formTagihan");
const tabel = document.getElementById("tabelTagihan");
const search = document.getElementById("search");
const filterStatus = document.getElementById("filterStatus");

function rupiah(v){
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v||0));
}

function simpan(){
  localStorage.setItem("monitoringPembayaran", JSON.stringify(data));
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
  return Math.max(0, Math.floor((hariIni() - a) / (1000*60*60*24)));
}

function isTerlambat(item){
  if(item.status === "Selesai dibayar") return false;
  const target = new Date(item.targetBayar);
  target.setHours(0,0,0,0);
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
  return {
    namaPekerjaan: document.getElementById("namaPekerjaan").value,
    lokasi: document.getElementById("lokasi").value,
    vendor: document.getElementById("vendor").value,
    nomorKontrak: document.getElementById("nomorKontrak").value,
    nilaiKontrak: Number(document.getElementById("nilaiKontrak").value || 0),
    nilaiTagihan: Number(document.getElementById("nilaiTagihan").value || 0),
    nomorInvoice: document.getElementById("nomorInvoice").value,
    tanggalInvoice: document.getElementById("tanggalInvoice").value,
    tanggalMasuk: document.getElementById("tanggalMasuk").value,
    targetBayar: document.getElementById("targetBayar").value,
    pic: document.getElementById("pic").value,
    status: document.getElementById("status").value,
    catatan: document.getElementById("catatan").value
  };
}

function setFormData(item){
  for(const key in item){
    const el = document.getElementById(key);
    if(el) el.value = item[key];
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const item = getFormData();

  if(editIndex === null){
    data.push(item);
  } else {
    data[editIndex] = item;
    editIndex = null;
    document.getElementById("submitBtn").textContent = "Simpan Data";
  }

  simpan();
  resetForm();
  render();
});

function resetForm(){
  form.reset();
  editIndex = null;
  document.getElementById("submitBtn").textContent = "Simpan Data";
}

function editData(i){
  editIndex = i;
  setFormData(data[i]);
  document.getElementById("submitBtn").textContent = "Update Data";
  location.hash = "#input";
}

function hapusData(i){
  if(confirm("Yakin ingin menghapus data tagihan ini?")){
    data.splice(i,1);
    simpan();
    render();
  }
}

function naikStatus(i){
  const urutan = ["Dokumen diterima","Verifikasi dokumen","Revisi vendor","Approval manajemen","Pengajuan pembayaran","Selesai dibayar"];
  const posisi = urutan.indexOf(data[i].status);
  data[i].status = urutan[(posisi + 1) % urutan.length];
  simpan();
  render();
}

function render(){
  const keyword = search.value.toLowerCase();
  const statusFilter = filterStatus.value;

  const filtered = data.filter(item => {
    const cocokKeyword = Object.values(item).join(" ").toLowerCase().includes(keyword);
    const cocokStatus = statusFilter === "" || item.status === statusFilter;
    return cocokKeyword && cocokStatus;
  });

  tabel.innerHTML = "";
  filtered.forEach(item => {
    const realIndex = data.indexOf(item);
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
      <td><span class="badge ${statusBadge(item.status)}">${item.status}</span></td>
      <td><span class="badge ${slaClass}">${slaText}</span></td>
      <td>${item.pic || "-"}</td>
      <td>${item.catatan || "-"}</td>
      <td class="action-cell">
        <button onclick="naikStatus(${realIndex})">Status</button>
        <button class="secondary" onclick="editData(${realIndex})">Edit</button>
        <button class="danger" onclick="hapusData(${realIndex})">Hapus</button>
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

search.addEventListener("input", render);
filterStatus.addEventListener("change", render);
render();
