import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent border-t border-gray-500/30">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Welloh. Tous droits réservés. Application à but éducatif uniquement.
        </p>
      </div>
    </footer>
  );
};

export default Footer;