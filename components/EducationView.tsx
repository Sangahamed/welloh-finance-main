import React, { useState } from 'react';
import { BookOpenIcon, PlayIcon } from './icons/Icons';
import { getEducationalContentStream } from '../services/geminiService';
import { useToast } from './ui/Toast';
import EducationModal from './EducationModal';

const EducationView: React.FC = () => {
  const { info } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const content = {
    beginner: [
      "Qu'est-ce qu'une action et une obligation ?",
      "Comment fonctionne une bourse ?",
      "Lire un graphique boursier pour les nuls",
      "Les différents types d'ordres (marché, limite, stop)",
      "Construire son premier portefeuille",
    ],
    intermediate: [
      "Introduction à l'analyse fondamentale (Ratio C/B, BPA)",
      "Les bases de l'analyse technique (Supports, Résistances, Moyennes Mobiles)",
      "La diversification : le seul repas gratuit en finance",
      "Comprendre les ETFs et les fonds indiciels",
      "Psychologie de l'investisseur : éviter les pièges courants",
    ],
    africaFocus: [
      "Introduction aux principales bourses africaines (JSE, NGX, BRVM)",
      "Les secteurs clés de la croissance en Afrique",
      "Analyser les risques et opportunités sur les marchés frontières",
      "Le rôle des matières premières dans les économies africaines",
      "Comprendre la ZLECAF et son impact sur les entreprises cotées",
    ]
  };

  const videoTutorials = [
    {
        title: "Prise en main de la plateforme Welloh",
        description: "Découvrez l'interface du dashboard, le passage d'ordres et le suivi de portefeuille.",
        thumbnail: "https://placehold.co/600x400/1e293b/9ca3af?text=Welloh"
    },
    {
        title: "Maîtriser l'outil d'Analyse IA",
        description: "Apprenez à générer des rapports financiers complets et à comparer des actions efficacement.",
        thumbnail: "https://placehold.co/600x400/3730a3/e0e7ff?text=Analyse+IA"
    },
    {
        title: "Introduction au marché de la BRVM",
        description: "Un aperçu des opportunités d'investissement en Afrique de l'Ouest.",
        thumbnail: "https://placehold.co/600x400/166534/a7f3d0?text=BRVM"
    }
  ];
  
  const handleTopicClick = async (topic: string) => {
    setSelectedTopic(topic);
    setIsModalOpen(true);
    setIsContentLoading(true);
    setContentError(null);
    setModalContent('');

    try {
        const stream = await getEducationalContentStream(topic);
        let fullText = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                setModalContent(fullText);
            }
        }
    } catch (error) {
        setContentError(error instanceof Error ? error.message : "Une erreur est survenue lors de la récupération du contenu.");
    } finally {
        setIsContentLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
        setSelectedTopic('');
        setModalContent('');
        setContentError(null);
    }, 300); // Wait for animation
  };

  const handleVideoClick = () => {
    info("Bientôt disponible", "La lecture de vidéos sera ajoutée dans une prochaine mise à jour.");
  };

  const renderTopicList = (topics: string[]) => (
    <ul className="space-y-3 list-disc list-inside text-gray-700 dark:text-gray-300">
        {topics.map((title, i) => (
            <li key={i}>
                <button 
                    onClick={() => handleTopicClick(title)}
                    className="text-left w-full hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                    {title}
                </button>
            </li>
        ))}
    </ul>
  );


  return (
    <div className="space-y-8">
      <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Centre d'Apprentissage
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
              Développez vos compétences en investissement avec nos guides et articles, des bases aux stratégies avancées.
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Beginner */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400">Coin des Débutants</h3>
          {renderTopicList(content.beginner)}
        </div>
        {/* Intermediate */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">Sujets Intermédiaires</h3>
          {renderTopicList(content.intermediate)}
        </div>
        {/* Africa Focus */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">Focus sur l'Afrique</h3>
          {renderTopicList(content.africaFocus)}
        </div>
      </div>
        
      {/* Video Tutorials Section */}
      <div className="pt-8">
         <div className="text-center mb-8">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
                Tutoriels Vidéo
            </h3>
            <p className="mt-2 max-w-2xl mx-auto text-md text-gray-600 dark:text-gray-300">
                Apprenez visuellement avec nos guides pas à pas.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videoTutorials.map((video) => (
                <div key={video.title} onClick={handleVideoClick} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden group cursor-pointer">
                    <div className="relative">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <PlayIcon className="h-16 w-16 text-white" />
                        </div>
                    </div>
                    <div className="p-4">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{video.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{video.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      <EducationModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedTopic}
          content={modalContent}
          isLoading={isContentLoading}
          error={contentError}
      />
    </div>
  );
};

export default EducationView;
