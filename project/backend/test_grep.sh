timeout 5 xvfb-run -a strace -f -e trace=file -o strace.log wine /opt/malware/WinlockerVB6Blacksod.exe
ls -la strace.log
echo "--- ALL GREP RESULTS ---"
grep -i 'encrypted_data.txt' strace.log
echo "--- FILTERED ---"
grep -i 'encrypted_data.txt' strace.log | grep 'openat' | cut -d '"' -f 2 | head -n 1
