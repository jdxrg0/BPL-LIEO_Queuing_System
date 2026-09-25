const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, 'client/src/components/Layout/Layout.jsx');
let content = fs.readFileSync(layoutPath, 'utf8');

// 1. Add import
if (!content.includes('import SettingsModal from')) {
  content = content.replace(
    "import ModalWrapper from '../Modals/ModalWrapper';",
    "import ModalWrapper from '../Modals/ModalWrapper';\nimport SettingsModal from '../Modals/SettingsModal';"
  );
}

// 2. Replace the giant modal block
const startIndex = content.indexOf('{/* Global Settings Modal');
const endIndex = content.indexOf('{/* Change Password Modal');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
        settings={settings}
        priorityGroups={priorityGroups}
        onChangePassword={() => { setShowSettingsModal(false); setShowChangePasswordModal(true); }}
        onResetDataRequest={() => { setResetConfirmText(''); setShowResetConfirmModal(true); }}
      />

      `;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(layoutPath, content, 'utf8');
  console.log("Successfully refactored Layout.jsx to use SettingsModal.");
} else {
  console.log("Could not find boundaries for Settings Modal in Layout.jsx.");
}
