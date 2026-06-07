PANDUAN WEBSITE MONITORING PEMBAYARAN TAGIHAN - VERSI FIREBASE

File ini sudah siap di-upload ke GitHub Pages.

File yang harus ada di repository GitHub:
1. index.html
2. style.css
3. script.js
4. README.txt atau README.md

Fitur:
- Login sederhana: admin/admin123, manager/manager123, operator/operator123
- Data monitoring disimpan di Firebase Firestore
- Data dapat dilihat bersama oleh tim dari perangkat berbeda
- Tambah, edit, hapus, update status
- Dashboard ringkasan otomatis
- Export CSV

Catatan penting:
1. Pastikan Firebase Firestore sudah dibuat.
2. Pastikan Firestore Rules masih dalam test mode saat uji coba.
3. Setelah upload ke GitHub, tunggu 1-3 menit agar GitHub Pages update.
4. Jika data tidak muncul, buka Console browser atau cek Firestore Rules.
5. Login di file ini masih login sederhana di sisi browser, bukan Firebase Authentication.
   Untuk keamanan kantor yang lebih kuat, perlu tahap lanjutan menggunakan Firebase Authentication dan Rules khusus user.
