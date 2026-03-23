import React from 'react';
import { BugAntIcon } from './icons/Icons';

const ErrorFallback: React.FC = () => {
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="flex flex-col justify-center items-center h-full bg-red-50 border-2 border-dashed border-red-400 text-red-700 rounded-lg p-8 text-center">
            <BugAntIcon className="h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-2xl font-semibold">Oups, une erreur est survenue !</h2>
            <p className="mt-2 max-w-md text-red-600">
                Un problème inattendu a empêché l'affichage de cette section. Vous pouvez essayer de recharger la page pour corriger le problème.
            </p>
            <button
                onClick={handleReload}
                className="mt-6 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-white"
            >
                Recharger l'application
            </button>
        </div>
    );
};

export default ErrorFallback;