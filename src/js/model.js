import { async } from 'regenerator-runtime';
import { API_URL, RES_PER_PAGE, KEY } from './config.js';
//import { getJSON, sendJSON } from './helpers.js'; on a refractor les 2 pr mettre en AJAX dc:
import { AJAX } from './helpers.js';
//import { entries } from 'core-js/core/array';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
  bookmarks: [],
};

//fonction pour le nouvel objet avec les val comme on veut qu on utilise dans loadRecipe:
const createRecipeObject = function (data) {
  //on va creer un nouvel objet qui a de meilleurs noms de variable (ex:enlever les _) :
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url, //premier qu on change ici pr enlever le _
    image: recipe.image_url, //2
    servings: recipe.servings,
    cookingTime: recipe.cooking_time, // 3
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }), //on fait ca pour dire si la cle existe ou pas
  };
};

//precisons que loadRecipe n est pas pure du tout car elle utilise des variable de dehors mais pg ici
export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}/${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);

    //some ca renvoi true si yen a dedans qui sont vrais
    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;

    //console.log(state.recipe); //verif que les nouvo nom de variable sont ok
  } catch (err) {
    console.error(`${err} !!`);
    throw err;
  }
};

//function pr la recherche:
export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;
    const data = await AJAX(`${API_URL}/?search=${query}&key=${KEY}`);
    //console.log(data);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        sourceUrl: rec.source_url, //premier qu on change ici pr enlever le _
        image: rec.image_url, //2
        ...(rec.key && { key: rec.key }), //on fait ca pour dire si la cle existe ou pas
      };
    });
    //si on change de recherche on doit remettre la page a 1 de la nvl recherche:
    state.search.page = 1;

    //console.log(state.search.results); // verif qu on a tt les resulats de la recherche ds la console
  } catch (err) {
    //console.error(`${err} !!`);
    throw err;
  }
};

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage; //0
  const end = page * state.search.resultsPerPage; //9
  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
    // newQt = oldQt * newServings / oldServings // 2 * 8 / 4 = 4
  });

  state.recipe.servings = newServings;
};

//fonction pour stocker sur le localstorage:
const persistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

//fonction qui ajoute le bookmark
export const addBookmark = function (recipe) {
  //Ajouter le bookmark
  state.bookmarks.push(recipe);

  //Mark current recipe as bookmark:
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
  persistBookmarks();
};

//fonction qui supprime le bookmark:
export const deleteBookmark = function (id) {
  //supp bookmark
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1); //splice supprime de la place index et le nombre d element a supp donc ici 1

  //Mark current recipe as not bookmark:
  if (id === state.recipe.id) state.recipe.bookmarked = false;
  persistBookmarks();
};

const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
};
init();

//
//fonc qui va je crois mettre les nouvelles recette ds l api de forkify:
export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong Ingredient format ! Please use the correct format!'
          );
        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });
    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };
    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    //console.log(data);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};
//821ab216-31da-437d-91c0-ca6157844e5f
