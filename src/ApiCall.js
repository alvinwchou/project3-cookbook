// ApiCall.js
import axios from 'axios';
import { useState, useEffect } from 'react';
import GalleryItem from './GalleryItem';
import Recipe from './Recipe';
import useWindowDimensions from './useWindowDimensions';
import ErrorMessage from './ErrorMessage';
import firebase from './firebase';
import { getDatabase, ref, onValue, push, remove } from 'firebase/database';

export default function ApiCall(props) {

    console.log('apicall ', props);
    const [recipes, setRecipes] = useState([]);
    
    // toggle between searched recipe and each recipe
    const [showRecipeCard, setShowRecipeCard] = useState(false);

    const [showSaved, setShowSaved] = useState(false)
    
    // show more button
    const [showMore, setShowMore] = useState(null);
    
    // toggle between false and true class styling
    const [error, setError] = useState(false);
    
    // get the current recipe user clicked
    const [display, setDisplay] = useState(null);

    // state for saved recipes
    const [savedRecipes, setSavedRecipes] = useState([]);

    // for window dimensions
    const { height, width } = useWindowDimensions();

    // api call
    useEffect( () => {
        setTimeout( () => {
            axios({
                url: 'https://api.edamam.com/api/recipes/v2',
                params: {
                app_id: '12a553b5',
                app_key: '6243134e8b4229cae7ecfea70b2a1bb1',
                type: 'public',
                q: props.params.searchItem,
                mealType: props.params.mealType,
                diet: props.params.balanced.value,
                diet: props.params.highFiber.value,
                diet: props.params.highProtein.value,
                diet: props.params.lowCarb.value,
                diet: props.params.lowFat.value,
                diet: props.params.lowSodium.value,
                },
            }).then( (apiData) => {
                setRecipes(apiData.data.hits);
                setShowRecipeCard(false);
                setShowSaved(false);
                setShowMore(apiData.data._links.next.href);
            }).catch( (err) => {
                setError(true);
            })
        }, 10)
    }, [props]);

    // when user clicks on a seached recipe
    const getClickedItemInfo = (e) => {
        setDisplay(e.target.parentElement.id)
        setShowRecipeCard(true)
    };

    // when user clicks on "back" when viewing a recipe
    const getBackClick = (e) => {
        setShowRecipeCard(false)
    };

    // when user clicks on "more"
    const handleClick = () => {
        window.scrollTo(0, 0);
        axios({
                url: showMore
            }).then( (apiData) => {
                setRecipes(apiData.data.hits)
                setShowRecipeCard(false)
                if (apiData.data._links.next.href){
                    setShowMore(apiData.data._links.next.href)
                } else {
                    setShowMore(null)
                }
            }).catch( (err) => {
                setError(true);
            })
    };

    const handleClickError = () => {
        setError(false)
    };

    const handleClickBookmark = () =>{
        setShowSaved(!showSaved) 
        setShowRecipeCard(false)
    }

    // save data to firebase
    const getSaveClick = () => {
        console.log('saved');
        console.log(display);
        const database = getDatabase(firebase);
        const dbRef = ref(database);
        const index = recipes.findIndex( (recipe) => {
            if (recipe.recipe.url === display) {
                return true
            }
        });
        console.log(index);
        console.log(recipes);
        console.log(recipes[index]);
        const save = {};
        save.label = recipes[index].recipe.label;
        save.source = recipes[index].recipe.source;
        save.totalTime = recipes[index].recipe.totalTime;
        save.image = recipes[index].recipe.image;
        save.ingredientLines = recipes[index].recipe.ingredientLines;
        save.url = recipes[index].recipe.url;
        save.cuisineType = recipes[index].recipe.cuisineType;
        save.mealType = recipes[index].recipe.mealType;
        save.dishType = recipes[index].recipe.dishType
        console.log(save);
        push(dbRef, save)
        // push(dbRef, recipes[index]);
    };

    // remove data from firebase
    const getRemoveClick = (recipeId) => {
        const database = getDatabase(firebase);
        const dbRef = ref(database, `/${recipeId}`)
        remove(dbRef)
        setShowRecipeCard(false)
    };

    // call to fatabase
    useEffect( () => {
        const database = getDatabase(firebase);
        const dbRef = ref(database);
        onValue(dbRef, (res) => {
            const newState = [];
            const data = res.val();
            console.log('FIREBASE DATA!!! ', data);
            for (let propertyName in data) {
                console.log(`${propertyName}: ${data[propertyName]}`);
                newState.push({key: propertyName, data: [data[propertyName]]});
            };
            console.log(newState);
            setSavedRecipes(newState);

        });
    }, []);
    
    console.log(savedRecipes);
    return(
        <div className='apiCall'> 
            {
                error ? <ErrorMessage handleClick={ handleClickError }/>: null
            }
            <div className="bookmark">
                <h2>
                    {
                        showSaved
                        ? "Saved "
                        : null
                    }
                Recipes</h2>
                <p className='toggle' onClick={ handleClickBookmark}>
                    {
                        showSaved
                        ? "search"
                        : "save"
                    }
                </p>
            </div>
            {   
                !showRecipeCard 
                ? <div className="galleryContainer">
                    <ul className="galleryWall">
                        {
                            showSaved
                            ? savedRecipes.map( (savedRecipe) => {
                                return(
                                    <GalleryItem
                                        key={savedRecipe.key}
                                        handleButton={ getClickedItemInfo }
                                        imgSource={savedRecipe.data[0].image}
                                        title={savedRecipe.data[0].label}
                                        id={savedRecipe.data[0].url}
                                    />
                                )
                            })
                            : recipes.map( (recipe) => {
                                return(
                                    <GalleryItem
                                        key={recipe.recipe.url}
                                        handleButton={ getClickedItemInfo }
                                        imgSource={recipe.recipe.image}
                                        title={recipe.recipe.label}
                                        id={recipe.recipe.url}
                                    />
                                )
                            })
                        }
                    </ul>
                    {
                    showMore && !showSaved ? <p className='more' onClick={ handleClick } >More</p> : null
                    }
                    {/* <p onClick={ handleClick }> {recipes ? 'more': ''}</p> */}
                </div>
                : <div className="recipeCard">
                    {
                        showSaved
                        ? savedRecipes.map( (savedRecipe) => {
                            return(
                                savedRecipe.data[0].url === display 
                                ? <Recipe 
                                    key={savedRecipe.key}
                                    title={savedRecipe.data[0].label}
                                    featured={savedRecipe.data[0].source}
                                    time={savedRecipe.data[0].totalTime}
                                    imgSorce={savedRecipe.data[0].image}
                                    ingredients={savedRecipe.data[0].ingredientLines}
                                    url={savedRecipe.data[0].url}
                                    cuisine={savedRecipe.data[0].cuisineType}
                                    meal={savedRecipe.data[0].mealType}
                                    dish={savedRecipe.data[0].dishType}
                                    handleClickBack={ getBackClick }
                                    handleClickRemove= { getRemoveClick }
                                    remove={savedRecipe.key}
                                />
                                : null
                            )
                        })
                        : recipes.map( (recipe) => {
                            return(
                                recipe.recipe.url === display 
                                ? <Recipe 
                                    key={recipe.recipe.url}
                                    title={recipe.recipe.label}
                                    featured={recipe.recipe.source}
                                    time={recipe.recipe.totalTime}
                                    imgSorce={recipe.recipe.image}
                                    ingredients={recipe.recipe.ingredientLines}
                                    url={recipe.recipe.url}
                                    cuisine={recipe.recipe.cuisineType}
                                    meal={recipe.recipe.mealType}
                                    dish={recipe.recipe.dishType}
                                    handleClickBack={ getBackClick }
                                    handleClickSave= { getSaveClick }
                                />
                                : null
                            )
                        })
                    }
                </div>
            }
        </div>
    )
};