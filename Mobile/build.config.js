// Configuração para forçar uso de legacy-peer-deps no build
module.exports = {
  hooks: {
    prebuild: async () => {
      // Garantir que .npmrc seja usado
      const fs = require('fs');
      const npmrcContent = 'legacy-peer-deps=true\n';
      if (!fs.existsSync('.npmrc')) {
        fs.writeFileSync('.npmrc', npmrcContent);
      }
    }
  }
};

