!macro customInstall
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\TerminalPlus" "" "Open in Terminal+"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\TerminalPlus" "Icon" '"$INSTDIR\Terminal+.exe"'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\TerminalPlus\command" "" '"$INSTDIR\Terminal+.exe" "%V"'
  
  WriteRegStr HKCU "Software\Classes\Directory\shell\TerminalPlus" "" "Open in Terminal+"
  WriteRegStr HKCU "Software\Classes\Directory\shell\TerminalPlus" "Icon" '"$INSTDIR\Terminal+.exe"'
  WriteRegStr HKCU "Software\Classes\Directory\shell\TerminalPlus\command" "" '"$INSTDIR\Terminal+.exe" "%V"'
!macroend

!macro customUninstall
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\TerminalPlus"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\TerminalPlus"
!macroend
