@echo off
setlocal EnableDelayedExpansion

echo ==========================================
echo  Obsidian Rooms - Plugin Installer
echo ==========================================
echo.
echo Please provide the path to your Obsidian vault.
echo Example: C:\Users\YourName\Documents\MyVault
echo.

:prompt
set /p vault_path="Enter the full path to your Obsidian vault: "

:: Remove quotes if the user added them
set vault_path=%vault_path:"=%

if not exist "%vault_path%" (
    echo.
    echo Error: The specified path does not exist!
    goto prompt
)

:: Check if they accidentally selected the .obsidian folder itself
:: We check if the path ends with .obsidian
set "last_nine=!vault_path:~-9!"
if /I "!last_nine!"==".obsidian" (
    echo.
    echo Error: You selected the .obsidian folder itself.
    echo Please provide the path to the main vault folder ^(the folder CONTAINING .obsidian^).
    goto prompt
)

:: Check if it's a valid Obsidian vault by looking for the .obsidian folder inside it
if not exist "%vault_path%\.obsidian" (
    echo.
    echo Error: No .obsidian folder found inside this directory.
    echo Are you sure this is an Obsidian vault? Please provide the correct path.
    goto prompt
)

set plugins_dir=%vault_path%\.obsidian\plugins
set dest_dir=%plugins_dir%\obsidian-rooms

if not exist "%plugins_dir%" (
    echo Creating plugins directory...
    mkdir "%plugins_dir%"
)

:: Cleanup existing plugin folder if it exists for a fresh install
if exist "%dest_dir%" (
    echo Cleaning up existing plugin files...
    rmdir /S /Q "%dest_dir%"
)

mkdir "%dest_dir%"

echo.
echo Installing new plugin files...
copy /Y "main.js" "%dest_dir%\main.js" >nul 2>&1
copy /Y "manifest.json" "%dest_dir%\manifest.json" >nul 2>&1
if exist "styles.css" (
    copy /Y "styles.css" "%dest_dir%\styles.css" >nul 2>&1
)

echo.
echo ==========================================
echo Success! Obsidian Rooms has been installed.
echo ==========================================
echo.
pause
