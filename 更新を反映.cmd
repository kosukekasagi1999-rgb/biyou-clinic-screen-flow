@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "GIT_EXE=git"
where git >nul 2>&1
if not errorlevel 1 goto :git_found

set "GIT_EXE="
for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do if exist "%%~fD\resources\app\git\cmd\git.exe" set "GIT_EXE=%%~fD\resources\app\git\cmd\git.exe"
if not defined GIT_EXE goto :git_missing

:git_found
"%GIT_EXE%" rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto :not_clone

set "BRANCH_FILE=%TEMP%\biyou-flow-branch-%RANDOM%-%RANDOM%.tmp"
"%GIT_EXE%" branch --show-current > "%BRANCH_FILE%"
set /p CURRENT_BRANCH=<"%BRANCH_FILE%"
del /q "%BRANCH_FILE%" >nul 2>&1
if /i not "%CURRENT_BRANCH%"=="main" goto :wrong_branch

"%GIT_EXE%" remote get-url origin >nul 2>&1
if errorlevel 1 goto :no_remote

"%GIT_EXE%" add -A
"%GIT_EXE%" diff --cached --quiet
if not errorlevel 1 goto :no_changes

set "COMMIT_MESSAGE=Update %date% %time:~0,8%"
"%GIT_EXE%" commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 goto :commit_failed

"%GIT_EXE%" pull --rebase origin main
if errorlevel 1 goto :pull_failed

"%GIT_EXE%" push origin main
if errorlevel 1 goto :push_failed

echo.
echo Changes were pushed to GitHub successfully.
echo GitHub Pages normally updates in about one minute.
goto :finish

:git_missing
echo Git was not found. Install GitHub Desktop and try again.
goto :failed

:not_clone
echo This is not a folder cloned with GitHub Desktop.
echo This button cannot be used in a folder downloaded as a ZIP file.
goto :failed

:wrong_branch
echo Switch to the main branch in GitHub Desktop and try again. Current branch: %CURRENT_BRANCH%
goto :failed

:no_remote
echo The GitHub remote named origin is not configured.
goto :failed

:no_changes
echo There are no changes to publish.
goto :finish

:commit_failed
echo The commit failed. Check your name and email settings in GitHub Desktop.
goto :failed

:pull_failed
echo GitHub changes could not be integrated. Check for conflicts in GitHub Desktop.
goto :failed

:push_failed
echo The push failed. Check your GitHub Desktop sign-in and network connection.
goto :failed

:failed
echo.
echo The update was not completed.

:finish
echo.
pause
endlocal

