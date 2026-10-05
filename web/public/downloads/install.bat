@echo off
setlocal

echo =========================================
echo Obsidian Rooms Plugin Installer
echo =========================================
echo.

set /p vault_path="Please enter the full path to your Obsidian vault (e.g. C:\Users\Name\Documents\MyVault): "

:: Remove trailing slash if present
if %vault_path:~-1%==\ set vault_path=%vault_path:~0,-1%

set plugin_dir="%vault_path%\.obsidian\plugins\obsidian-rooms"


if not exist "%vault_path%\.obsidian" (
    echo Error: Could not find .obsidian folder in that path.
    echo Are you sure this is an Obsidian vault?
    pause
    exit /b 1
)

if not exist %plugin_dir% mkdir %plugin_dir%

copy /Y main.js %plugin_dir%\ > nul
copy /Y manifest.json %plugin_dir%\ > nul
if exist styles.css copy /Y styles.css %plugin_dir%\ > nul

echo.
echo =========================================
echo Install Complete!
echo =========================================
echo Open Obsidian, go to Settings -^> Community Plugins,
echo disable Safe Mode if prompted, and enable "Obsidian Rooms".
echo.
pause
