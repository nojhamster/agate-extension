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

# Installation

## Chrome
  - Téléchargez le dernier fichier CRX depuis la [page des releases](https://github.com/nojhamster/agate-extension/releases).
  - Ouvrez l'onglet des extensions (menu -> plus d'outils -> extensions).
  - Déposez le fichier CRX dans la fenêtre.

**NB:** sous windows, Chrome désactive les extensions ne provenant pas du Web Store à chaque démarrage.

## Firefox
  - Téléchargez le dernier fichier XPI depuis la [page des releases](https://github.com/nojhamster/agate-extension/releases).
  - Ouvrez l'onglet des extensions (menu -> modules -> extensions).
  - Déposez le fichier XPI dans la fenêtre.

## Alternative : marque-page

Si l'extension n'est pas disponible pour votre navigateur ou ne fonctionne pas correctement, vous pouvez installer [ce bookmarklet](https://cdn.rawgit.com/nojhamster/agate-extension/v1.0.6/bookmark.html). Vous pourrez ensuite l'exécuter depuis votre barre de favoris, après vous être rendus sur la page des horaires mensuels.

# Agate Desktop

Vous pouvez désormais accéder à Agate depuis votre bureau avec l'application **Agate Desktop**. Disponible pour **Windows** et **Linux**, en version installable ou standalone, celle-ci permet d'accéder rapidement à Agate et intègre les fonctionnalités de l'extension. Vous pouvez télécharger la dernière version depuis la [page des releases](https://github.com/nojhamster/agate-extension/releases).

**Node Bene**:
L'application Windows n'étant pas signée, une fenêtre Smartscreen peut apparaître au premier lancement. Vous pouvez tout de même l'exécuter en cliquant sur `informations complémentaires`, puis `exécuter quand même`.

