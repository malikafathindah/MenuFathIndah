/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: AUTO-UPLOADER BROSUR PT. FATH INDAH TRAVEL SERVICE
 * ============================================================================
 * Folder Target Google Drive:
 * https://drive.google.com/drive/folders/1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc
 * Folder ID: 1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc
 * ============================================================================
 * 
 * CARA PEMASANGAN (Hanya 1 Menit):
 * 1. Buka https://script.google.com dengan akun Google yang memiliki akses folder di atas.
 * 2. Klik "New project" / "Proyek baru", beri nama "Uploader Brosur Fath Indah".
 * 3. Hapus kode default, tempel (paste) seluruh isi skrip ini.
 * 4. Klik ikon Save (Disket).
 * 5. Klik tombol "Deploy" (Terapkan) di kanan atas -> pilih "New deployment" (Penerapan baru).
 * 6. Klik ikon gerigi (Settings) di sebelah "Select type" -> pilih "Web app" (Aplikasi web).
 * 7. Atur konfigurasi berikut:
 *    - Description: Uploader Brosur Fath Indah
 *    - Execute as: Me (email-anda@gmail.com)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING agar web app bisa upload
 * 8. Klik "Deploy", izinkan otorisasi akses Google Drive (klik Advanced -> Go to ... (unsafe) -> Allow).
 * 9. Salin "Web app URL" (format: https://script.google.com/macros/s/AKfycb.../exec).
 * 10. Tempel URL tersebut di menu "Konfigurasi DB" atau pada tombol "⚙️ Pasang Auto-Upload" di modul Launching Brosur!
 */

const TARGET_FOLDER_ID = "1nDoE-UPkzVwt6m_OwOpP6G-1O8w4T9wc";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        message: "Payload tidak ditemukan atau data post kosong."
      });
    }

    var payload = JSON.parse(e.postData.contents);
    var folderId = payload.folderId || TARGET_FOLDER_ID;
    
    // Ambil target folder di Google Drive
    var folder = DriveApp.getFolderById(folderId);
    if (!folder) {
      return createJsonResponse({
        success: false,
        message: "Folder Google Drive tidak ditemukan dengan ID: " + folderId
      });
    }

    var fileName = payload.fileName || ("BROSUR_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".pdf");
    var mimeType = payload.mimeType || "application/pdf";
    var base64String = payload.base64;

    if (!base64String) {
      return createJsonResponse({
        success: false,
        message: "Konten file Base64 tidak ditemukan."
      });
    }

    // Hilangkan prefix data URL jika ada (contoh: data:application/pdf;base64,...)
    if (base64String.indexOf(",") > -1) {
      base64String = base64String.split(",")[1];
    }

    // Decode dan buat file langsung di dalam folder target
    var decoded = Utilities.base64Decode(base64String);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var createdFile = folder.createFile(blob);

    // Set permission agar file dapat diakses siapapun yang memiliki tautan
    try {
      createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log("Peringatan sharing file: " + shareErr);
    }

    var fileId = createdFile.getId();
    var directViewUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";

    return createJsonResponse({
      success: true,
      message: "File brosur berhasil diunggah ke Google Drive!",
      fileId: fileId,
      fileName: createdFile.getName(),
      directLink: directViewUrl,
      fileUrl: directViewUrl,
      folderUrl: "https://drive.google.com/drive/folders/" + folderId,
      sizeBytes: createdFile.getSize()
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "Gagal mengunggah file ke Google Drive: " + error.toString()
    });
  }
}

function doGet(e) {
  return createJsonResponse({
    success: true,
    status: "active",
    message: "Google Drive Uploader Webhook PT. Fath Indah Travel Service aktif dan siap digunakan.",
    targetFolderId: TARGET_FOLDER_ID,
    targetFolderUrl: "https://drive.google.com/drive/folders/" + TARGET_FOLDER_ID,
    timestamp: new Date().toISOString()
  });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
