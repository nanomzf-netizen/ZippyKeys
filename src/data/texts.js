// ═══════════════════════════════════════════════════════════
// TEXTS DATABASE — KETIK NGEBUT
// ═══════════════════════════════════════════════════════════

export const TEXTS = {
  random: [
    'langit biru cerah menghiasi pagi yang indah di kota kami',
    'teknologi modern memudahkan kehidupan sehari-hari manusia',
    'belajar mengetik cepat memerlukan latihan yang tekun dan konsisten',
    'kecepatan dan akurasi adalah dua hal penting dalam mengetik',
    'hujan turun deras membasahi jalanan kota yang ramai dan sibuk',
    'kopi hangat di pagi hari membuat pikiran menjadi lebih segar',
    'musik klasik mengalun merdu mengiringi malam yang tenang',
    'buku adalah jendela dunia yang membuka wawasan luas',
    'persahabatan sejati adalah harta yang tak ternilai harganya',
    'mimpi besar dimulai dari langkah kecil yang berani',
  ],

  peribahasa: [
    'bagai air di daun talas rajin pangkal pandai hemat pangkal kaya',
    'berakit rakit ke hulu berenang renang ke tepian bersakit sakit dahulu bersenang senang kemudian',
    'seperti pungguk merindukan bulan ada udang di balik batu',
    'tak ada rotan akar pun jadi bersatu kita teguh bercerai kita runtuh',
    'air tenang menghanyutkan dimana ada gula disitu ada semut',
    'sekali dayung dua tiga pulau terlampaui sedikit demi sedikit lama lama menjadi bukit',
    'tong kosong nyaring bunyinya besar pasak daripada tiang',
    'sepandai pandai tupai melompat akhirnya jatuh juga',
  ],

  coding: [
    'const sum = (a, b) => a + b',
    'function fetchData(url) { return fetch(url) }',
    'import React, { useState, useEffect } from "react"',
    'const arr = [1, 2, 3].map(x => x * 2).filter(x => x > 2)',
    'if (user.isAuthenticated) { redirect("/dashboard") }',
    'async function getData() { const res = await api.get("/users") }',
    'const theme = darkMode ? "dark" : "light"',
    'for (let i = 0; i < array.length; i++) { console.log(i) }',
  ],

  quotes: [
    'sukses adalah hasil dari persiapan kerja keras dan belajar dari kegagalan',
    'jangan pernah menyerah karena setiap kegagalan adalah pelajaran berharga',
    'masa depan milik mereka yang percaya pada keindahan mimpi mereka',
    'kebahagiaan bukanlah tujuan akhir melainkan perjalanan yang kita nikmati',
    'pendidikan adalah senjata paling ampuh untuk mengubah dunia',
    'kesempatan tidak datang dua kali raihlah saat ini juga',
  ],
};

// Helper: random pick
export function getRandomText(category = 'random') {
  const pool = TEXTS[category] || TEXTS.random;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Helper: split into words (preserve spaces)
export function splitToWords(text) {
  return text.split(' ');
}
