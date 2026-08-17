@echo off
chcp 65001 >nul
echo.
echo  ============================================
echo     SMARTPARK - Akilli Otopark Sistemi
echo     Sunucu gerekmez - Dogrudan tarayicida!
echo  ============================================
echo.

:: Proje dizini
set DIR=%~dp0

echo  Dosyalar kontrol ediliyor...
if not exist "%DIR%entrance.html" (
    echo  [HATA] entrance.html bulunamadi!
    pause & exit /b
)

echo  SmartPark tarayicida aciliyor...
echo.
echo  Acilacak sayfalar:
echo  - Giris Ekrani  : entrance.html
echo  - Kat 1 Ekrani  : floor.html?id=1
echo  - Kullanici     : portal.html
echo.

:: Varsayilan tarayicida ac
start "" "%DIR%entrance.html"

echo  Tarayici acildi!
echo  Birden fazla sekme icin diger dosyalari da acabilirsiniz.
echo.
pause
