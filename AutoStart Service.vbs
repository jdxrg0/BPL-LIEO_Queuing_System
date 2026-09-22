Set objFSO = CreateObject("Scripting.FileSystemObject")
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
' Run the batch file silently (0 means hide window)
WshShell.Run chr(34) & strScriptPath & "\Start BPLO System.bat" & chr(34), 0

Set WshShell = Nothing
