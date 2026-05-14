import { processQuery as fallbackProcessQuery } from './localAiEngine';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const queryOllama = async (userMessage, context) => {
  const { employees, shifts, leaves, swapRequests, openShifts, geminiApiKey } = context;

  if (!geminiApiKey || geminiApiKey.trim() === '') {
    return "Tolong masukkan Gemini API Key Anda di menu Pengaturan (AI Assistant) agar saya bisa cerdas membantu Anda.";
  }

  // Hapus pembatasan data. Kirim seluruh data aplikasi apa adanya agar Gemini tahu segalanya.
  const appState = {
    tanggalHariIni: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    karyawan: employees,
    jadwalShift: shifts,
    pengajuanCuti: leaves,
    bursaShift: openShifts,
    tukarShift: swapRequests
  };

  const systemPrompt = `Kamu adalah asisten cerdas aplikasi penjadwalan ShiftSync bernama ShiftBot. Jawab pertanyaan pengguna dengan singkat, jelas, dan ramah dalam bahasa Indonesia. Kamu memiliki akses penuh dan TIDAK DIBATASI ke seluruh database aplikasi saat ini.

Berikut adalah keseluruhan data (karyawan, jadwal shift sebulan, cuti, dll) dalam format JSON:
${JSON.stringify(appState, null, 2)}

Pertanyaan Pengguna: ${userMessage}
`;

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Jika gagal (misalnya API key salah atau tidak ada internet), fallback ke mesin lokal
    const fallbackReply = fallbackProcessQuery(userMessage, context);
    return fallbackReply + "\n\n*(ℹ️ Koneksi ke Gemini gagal. Merespon menggunakan mesin lokal)*";
  }
};

