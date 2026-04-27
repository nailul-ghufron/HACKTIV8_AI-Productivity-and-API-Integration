# Product Requirements Document (PRD)

Product Name: KarierKu AI - Tech Career & Interview Mentor

Document Version: 1.

Target Platform: Web Application (Responsive)

Author: [Nama Anda] - Product Manager / Developer

Status: 🟢 Approved for Development (Final Project)

## 1. Executive Summary

KarierKu AI adalah asisten virtual (chatbot) berbasis Gemini AI yang dirancang khusus untuk membantu pencari kerja di
bidang IT (Software Engineer, Data Analyst, UI/UX). Di tengah dinamisnya pasar kerja teknologi tahun ini, KarierKu AI hadir
sebagai "Mentor Senior" yang memberikan simulasi _technical interview_ , memberikan _feedback_ pada CV, dan memberikan
rekomendasi _upskilling_.

## 2. Problem Statement & Use Case

```
Problem: Banyak lulusan IT atau career switcher yang kesulitan mempersiapkan diri untuk technical interview dan tidak
tahu apakah CV mereka sudah sesuai dengan standar Applicant Tracking System (ATS) perusahaan teknologi.
Use Case: Career & Education Assistant.
Target Audience: Junior Developers, Job Seekers, IT Fresh Graduates, Bootcamp Alumni.
```
## 3. Product Features & User Stories

```
Feature User Story Priority Modul Hacktiv
Chatbot Interaktif Sebagai user, saya ingin bertanya tentang tips karir IT dan mendapatkan
jawaban yang natural.
```
```
P0 Sesi 3 (Express &
Fetch)
Simulasi Interview Sebagai user, saya ingin AI memberikan saya pertanyaan teknis (misal:
React/Node.js) layaknya interviewer sungguhan.
```
```
P0 Sesi 3 (System
Instruction)
CV Review
(Multimodal)
```
```
Sebagai user, saya ingin mengunggah file CV (PDF/Image) agar AI bisa
memberikan kritik dan saran.
```
```
P1 Sesi 2 (File API /
Multimodal)
Dark/Light Mode UI Sebagai user, saya ingin tampilan UI yang nyaman di mata dan modern. P2 Sesi 1 (UI by v0/Gemini
Canvas)
```
## 4. Konfigurasi Parameter AI (Kreativitas)

Sesuai dengan ketentuan tugas akhir, berikut adalah konfigurasi model Gemini AI yang digunakan:
Model: gemini-1.5-flash (Optimal untuk respons cepat dan analisis dokumen Sesi 2 & 3).
System Instruction (Persona):
_"Kamu adalah 'Budi', seorang Senior Engineering Manager di perusahaan Tech ternama di Indonesia. Gaya
bahasamu profesional tapi santai dan suportif (menggunakan kata 'saya' dan 'kamu', sesekali menggunakan
istilah anak IT seperti 'deploy', 'bug', 'agile'). Tugasmu adalah membantu junior developer mempersiapkan
interview, memberikan tantangan coding sederhana jika diminta, dan memberikan saran karir. Jika user
mengunggah CV, berikan kritik membangun (roasting halus namun solutif) untuk memperbaiki CV tersebut
agar lolos ATS."_
Generation Config:
temperature: 0.7 (Keseimbangan antara jawaban faktual tentang coding dan gaya bahasa mentor yang luwes).


```
top_p: 0.9 (Memberikan variasi kosakata yang natural).
top_k: 40
maxOutputTokens: 1024 (Membatasi jawaban agar tidak terlalu panjang/bertele-tele, pas untuk UI chat).
```
## 5. System Architecture & Tech Stack

Sistem akan dibangun menggunakan arsitektur Client-Server sederhana (Sesi 3):
Frontend: HTML, CSS, Vanilla JavaScript (Fetch API). Desain awal bisa di-generate menggunakan Gemini Canvas/v
(Sesi 1).
Backend: Node.js, Express.js.
AI Provider: Google Gemini API (menggunakan SDK @google/genai atau @google/generative-ai).
Environment: dotenv untuk mengamankan API Key.
Alur Kerja Sistem (Data Flow):

1. User mengetik pesan atau mengunggah CV di UI Browser.
2. JS (Frontend) mengirim request POST via fetch() ke endpoint backend lokal (misal: /api/chat).
3. Backend Express.js menerima _request_ , menyusun payload, dan memanggil Gemini API dengan parameter yang telah
    ditentukan.
4. Gemini merespons ke backend, backend meneruskan (JSON) ke frontend.
5. UI meng-update _chat bubble_ secara asinkron.

## 6. Success Metrics (Final Project Deliverables)

Untuk memastikan kelulusan _Final Project_ , indikator kesuksesan aplikasi ini adalah terpenuhinya _deliverables_ berikut:
[ ] Fungsionalitas: Chatbot bisa membalas pesan secara dinamis (tidak statis).
[ ] Kesesuaian: Prompt dan parameter sesuai dengan ide _Career Mentor_.
[ ] Dokumentasi: Repositori GitHub dibuat (Public) berisikan _source code_ Frontend & Backend.
[ ] Visual: Terdapat Screenshot UI aplikasi yang berjalan dengan baik.
[ ] Submission: Link GitHub dan Screenshot disubmit tepat waktu (H+2 Sesi 5, 23.59 WIB).

## 7. Tahapan Pengembangan (4)

```
Tahap 1: Setup Project (npm init, Express, dotenv), Setup Gemini API Key, Uji coba API di Postman.
Tahap 2: Generate UI dengan AI tools (HTML/CSS), Buat logika Frontend (JS Fetch).
Tahap 3: Integrasi Frontend dan Backend, Tuning System Instruction, Uji coba simulasi chat.
Tahap 4: Bug fixing , Push ke GitHub, Ambil Screenshot, Submit Final Project.
```

