import * as model from './model.js';
import { MODAL_CLOSE_SEC } from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import recipeView from './views/recipeView.js';
import { async } from 'regenerator-runtime';

// if (module.hot) { avec ca leffet de page 1,2,3 etc marche pas
//   module.hot.accept();
// }

//on va creer une fonction async qui va faire fetch donc ajax pour recup les donnees: (en arriere plan)
const controlRecipes = async function () {
  try {
    const id = window.location.hash.slice(1); // va prendre le id par ex:5ed6604591c37cdc054bc886 de
    //la recette et recevra 5ed6604591c37cdc054bc886 avec # devant donc slice pr prendre que le nbr

    if (!id) return;
    recipeView.renderSpinner();

    //0. update result view to mark selecter search result:
    resultsView.update(model.getSearchResultsPage());

    //1.update bookmarks view
    bookmarksView.update(model.state.bookmarks);

    //2.Loading recipe:
    await model.loadRecipe(id); //appel la fonction du model.js

    //3.Rendering recipe :
    recipeView.render(model.state.recipe);
  } catch (err) {
    recipeView.renderError();
  }
};
//en dessous on utilise 2 fois la meme fonction avec 2 event different donc pas top ca duplique:
//mais on la enlever et mis dans recipeView.js
// window.addEventListener('hashchange', controlRecipes);
// window.addEventListener('load', controlRecipes); //des le chargement de la page
//pour corriger on fait ca et c top si on a 10 event ca arrange encore pls:
// ['haschange', 'load'].forEach(ev =>
//   window.addEventListener(ev, controlRecipes)
// );

//fonction du controller pr la recherche:
const controlSearchResults = async function () {
  try {
    resultsView.renderSpinner(); //met le rond qui tourne ds la recherche

    //1.get search query
    const query = searchView.getQuery();
    if (!query) return;

    //2. Load search results
    await model.loadSearchResults(query);

    //3.render results
    //console.log(model.state.search.results); affiche dans la console les result ds la recherche
    //resultsView.render(model.state.search.results); //pr ts les resu mais ns on ve page de 10
    resultsView.render(model.getSearchResultsPage());

    //4 render initial pagination button , pour mettre les boutton page 1 etc:
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

const controlPagination = function (goToPage) {
  //1.render new results
  resultsView.render(model.getSearchResultsPage(goToPage));

  //2 pour actualiser les boutton page 1 etc apres click:
  paginationView.render(model.state.search);
};

//fonction qui va mettre a jour le recipe serving :
const controlServings = function (newServings) {
  //  maj recipe serving dans le state
  model.updateServings(newServings);
  //  maj le recipe view
  //recipeView.render(model.state.recipe); marche mais quand on change le nombre la photo recharge
  recipeView.update(model.state.recipe);
};

//fonction pr check si le bookmark est selectionner ou pas et fait des choses suivant ca:
const controlAddBookmark = function () {
  //add or remove a bookmark:
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);

  //update recipe view
  recipeView.update(model.state.recipe);

  //render bookmarks:
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    //show the loading spinner :
    addRecipeView.renderSpinner();

    //Upload the new recipe data:
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    //render recipe:
    recipeView.render(model.state.recipe);

    //Success Message:
    addRecipeView.renderMessage();

    //render bookmark view:
    bookmarksView.render(model.state.bookmarks);

    //change id in url : si je creer une recette ca laisse lurl de la recette de l api donc pas cool:
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    //close form window:
    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000);

    //
  } catch (err) {
    console.error(err);
    addRecipeView.renderError(err.message);
  }
};

//fonction qui initialise au debut du chagement
const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks);
  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
};

init();
