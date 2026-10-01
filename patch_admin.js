const fs = require('fs');
let code = fs.readFileSync('client/src/pages/AdminDashboard.tsx', 'utf8');

const searchStr = `  return (
    <>
      {datePickerPortal}) => {
      clearInterval(interval);`;

const replaceStr = `    return () => {
      clearInterval(interval);
      socket.off('queueUpdated', handleUpdate);
      socket.off('ticketCreated', handleUpdate);
      socket.off('ticketCalled', handleUpdate);
      socket.off('userOnlineStatus');
      socket.off('userUpdated');
      delete (window as any).doPrintReport;
    };
  }, [trendStart, trendEnd, filterYear]);

  return (
    <>
      {datePickerPortal}`;

code = code.replace(`}) => {\r\n      clearInterval(interval);`, `\r\n    return () => {\r\n      clearInterval(interval);`);
// The replace above is simplistic, let me just fix it carefully with JS.

let lines = code.split('\n');
let i = lines.findIndex(l => l.includes('{datePickerPortal}) => {'));
if (i !== -1) {
  lines[i] = lines[i].replace('{datePickerPortal}) => {', 'return () => {');
  
  // We need to move the `return (\n <>\n {datePickerPortal}` below the useEffect close.
  let closeIdx = lines.findIndex((l, idx) => idx > i && l.includes('}, [trendStart, trendEnd, filterYear]);'));
  if (closeIdx !== -1) {
    lines.splice(closeIdx + 1, 0, '\n  return (\n    <>\n      {datePickerPortal}');
    
    // remove the old `return (\n    <>`
    if (lines[i-2].includes('return (') && lines[i-1].includes('<>')) {
      lines.splice(i-2, 2);
    }
  }
}
fs.writeFileSync('client/src/pages/AdminDashboard.tsx', lines.join('\n'));
console.log("Fixed AdminDashboard.tsx");
