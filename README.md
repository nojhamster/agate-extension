# Agate made simple
`Agate made simple` est un script qui s'intègre à Agate et ajoute des métriques simplifiées dans le résumé horaire du mois en cours. Celui-ci est disponible sous la forme d'une extension pour navigateur, d'un bookmarklet ou d'une application de bureau.

Les métriques suivantes sont ajoutées au résumé horaire :

  - Le temps de travail effectif (somme des badgeages).
  - Le temps de pause.
  - Les régulations, incluant la pause méridienne (sauf en cas de demi-journée).
  - Le temps de travail restant.
  - L'heure de fin de journée prévue.
  - L'état horaire au jour précédent
  - L'état horaire actuel

# Navigateurs supportés
  - Chrome > 49
  - Firefox > 34
  - Edge > 14

# Extension navigateur

## Chrome
  - Téléchargez le dernier fichier CRX depuis la [page des releases](https://github.com/nojhamster/agate-extension/releases).
  - Ouvrez l'onglet des extensions (menu -> plus d'outils -> extensions).
  - Déposez le fichier CRX dans la fenêtre.

### Installation en mode développeur
Les versions récentes de Chrome refusent d'activer les extensions ne provenant pas du Web Store. Vous pouvez cependant installer l'extension directement depuis le code source.
  - Téléchargez l'archive zip du code source depuis la [page des releases](https://github.com/nojhamster/agate-extension/releases).
  - Décompressez l'archive à l'emplacement de votre choix.
  - Ouvrez l'onglet des extensions (menu -> plus d'outils -> extensions).
  - Activez le mode développeur (en haut à droite).
  - Cliquez sur "Charger l'extension non empaquetée" et sélectionnez le dossier `extension` de l'archive.

## Firefox
  - Téléchargez le dernier fichier XPI depuis la [page des releases](https://github.com/nojhamster/agate-extension/releases).
  - Ouvrez l'onglet des extensions (menu -> modules -> extensions).
  - Déposez le fichier XPI dans la fenêtre.

# Bookmarklet

Si l'extension n'est pas disponible pour votre navigateur ou ne fonctionne pas correctement, vous pouvez installer [ce bookmarklet](https://cdn.rawgit.com/nojhamster/agate-extension/v1.0.6/bookmark.html). Vous pourrez ensuite l'exécuter depuis votre barre de favoris, après vous être rendus sur la page des horaires mensuels.

# Agate Desktop

Avec l'application **Agate Desktop**, vous pouvez désormais accéder à Agate depuis votre bureau. Disponible pour **Windows** et **Linux**, en version installable ou standalone, celle-ci permet d'accéder rapidement à Agate et intègre les fonctionnalités de l'extension. Vous pouvez télécharger la dernière version depuis la [page des releases](https://github.com/nojhamster/agate-extension/releases).

**Node Bene**:
L'application Windows n'étant pas signée, une fenêtre Smartscreen peut apparaître au premier lancement. Vous pouvez tout de même l'exécuter en cliquant sur `informations complémentaires`, puis `exécuter quand même`.

