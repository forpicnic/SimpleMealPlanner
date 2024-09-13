import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './components/ui/dialog';
import { PlusCircle, Shuffle, X } from 'lucide-react';

const RecipeDisplay = ({ recipe, imageSize = "medium", fullWidth = false }) => {
    const sizeClasses = {
      small: "h-24",
      medium: "h-32",
      large: "h-40"
    };
  
    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {recipe && recipe.image ? (
          <img 
            src={typeof recipe.image === 'string' ? recipe.image : URL.createObjectURL(recipe.image)} 
            alt={recipe.title} 
            className={`${sizeClasses[imageSize]} w-full object-cover`}
          />
        ) : (
          <div className={`${sizeClasses[imageSize]} w-full bg-gray-200 flex items-center justify-center`}>
            <span className="text-gray-500 text-sm">No image</span>
          </div>
        )}
        <div className="h-12 pt-2">
          <span className="font-medium text-center line-clamp-2">{recipe ? recipe.title : 'No recipe'}</span>
        </div>
      </div>
    );
  };
  
const tagOptions = {
  mealDay: ['Weekday', 'Weekend'],
  mealTime: ['Breakfast', 'Lunch', 'Dinner'],
  cuisine: ['Chinese', 'Japanese', 'Thai', 'Italian', 'Mexican', 'American'],
  prepTime: ['5 min', '15 min', '30 min', '>30 min']
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MealPlanner = () => {
  // State declarations
    const [recipes, setRecipes] = useState(() => {
        const savedRecipes = localStorage.getItem('recipes');
        if (savedRecipes) {
          return JSON.parse(savedRecipes).map(recipe => ({
            ...recipe,
            image: recipe.image && typeof recipe.image === 'string' ? recipe.image : null
          }));
        }
        return [];
    });

  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    const storedPlan = localStorage.getItem('weeklyPlan');
    if (storedPlan) {
      return JSON.parse(storedPlan);
    }
    // If no stored plan, generate a new one
    return generateWeeklyPlan(recipes);
  });

  const [activeTab, setActiveTab] = useState('weeklyPlan');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const [newRecipe, setNewRecipe] = useState({ 
    title: '', 
    ingredients: '', 
    instructions: '', 
    image: null,
    tags: {
      mealDay: '',
      mealTime: '',
      cuisine: '',
      prepTime: ''
    }
  });

  const sanitizeFilename = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim('-');
  };

  useEffect(() => {
    console.log('Recipes updated:', recipes);
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
  }, [recipes, weeklyPlan]);

  useEffect(() => {
    const storedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]');
    if (recipes.length !== storedRecipes.length) {
      // Recipes have been added or removed, generate a new plan
      setWeeklyPlan(generateWeeklyPlan(recipes));
    }
  }, [recipes]);

  useEffect(() => {
    if (editingRecipe) {
      setNewRecipe(editingRecipe);
    }
  }, [editingRecipe]);

  const handleSaveRecipe = async () => {
    if (newRecipe.title) {  // Only require the title
      let imageUrl = newRecipe.image;
      if (newRecipe.image && newRecipe.image instanceof File) {
        // It's a new image file
        const fileExtension = newRecipe.image.name.split('.').pop();
        const sanitizedName = sanitizeFilename(newRecipe.title);
        const imageName = `${sanitizedName}.${fileExtension}`;
        imageUrl = `/images/${imageName}`;

        // In a real scenario, you'd upload the file here
        // For now, we'll just pretend it's stored
        console.log(`Image would be saved as: ${imageUrl}`);
      } else if (typeof newRecipe.image === 'string' && !newRecipe.image.startsWith('/images/')) {
        // It's a base64 string from an older version of the app
        // You might want to handle this case differently
        imageUrl = null;
      }
      const recipeToSave = {
        ...newRecipe,
        image: imageUrl,
        id: editingRecipe ? editingRecipe.id : Date.now()
      };  

      if (editingRecipe) {
        // Editing existing recipe
        setRecipes(prevRecipes => prevRecipes.map(recipe => 
          recipe.id === editingRecipe.id ? recipeToSave : recipe
        ));
      } else {
        // Adding new recipe
        setRecipes(prevRecipes => [...prevRecipes, recipeToSave]);
      }
      setNewRecipe({ 
        title: '', 
        ingredients: '', 
        instructions: '', 
        image: null,
        tags: {
          mealDay: '',
          mealTime: '',
          cuisine: '',
          prepTime: ''
        }
      });
      setEditingRecipe(null);
      setIsDialogOpen(false);
    }
  };

  const exportRecipes = () => {
    const dataStr = JSON.stringify(recipes);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'recipes.json';
  
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const importRecipes = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedRecipes = JSON.parse(e.target.result);
          setRecipes(prevRecipes => [...prevRecipes, ...importedRecipes]);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Error importing recipes. Please make sure the file is a valid JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  const removeRecipe = (id) => {
    setRecipes(recipes.filter(recipe => recipe.id !== id));
  };

  const handleTagChange = (tagType, value) => {
    setNewRecipe({
      ...newRecipe,
      tags: {
        ...newRecipe.tags,
        [tagType]: value
      }
    });
  };

  const generateWeeklyPlan = (recipeList) => {
    const newWeeklyPlan = {};
    const usedLunchRecipes = new Set();
  
    daysOfWeek.forEach(day => {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      const dayType = isWeekend ? 'Weekend' : 'Weekday';
  
      // For breakfast and dinner, keep the existing logic
      const breakfast = getRandomRecipe('Breakfast', dayType);
      const dinner = getRandomRecipe('Dinner', dayType);
  
      // For lunch, ensure we don't repeat recipes
      let lunch;
      const availableLunchRecipes = recipes.filter(recipe => 
        recipe.tags.mealTime === 'Lunch' && 
        recipe.tags.mealDay === dayType &&
        !usedLunchRecipes.has(recipe.id)
      );
  
      if (availableLunchRecipes.length > 0) {
        lunch = availableLunchRecipes[Math.floor(Math.random() * availableLunchRecipes.length)];
        usedLunchRecipes.add(lunch.id);
      } else {
        // If we've used all recipes, reset and choose from all lunch recipes
        lunch = getRandomRecipe('Lunch', dayType);
        usedLunchRecipes.clear();
        usedLunchRecipes.add(lunch.id);
      }
  
      newWeeklyPlan[day] = {
        Breakfast: breakfast,
        Lunch: lunch,
        Dinner: dinner
      };
    });
    
    return newWeeklyPlan;
  };

  const handleReshuffleWeeklyPlan = () => {
    const newPlan = generateWeeklyPlan(recipes);
    setWeeklyPlan(newPlan);
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setIsDialogOpen(true);
  };

  const getRandomRecipe = (mealTime, mealDay) => {
    const filteredRecipes = recipes.filter(recipe => 
      recipe.tags.mealTime === mealTime && recipe.tags.mealDay === mealDay
    );
    return filteredRecipes.length > 0 
      ? filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)] 
      : null;
  };

  const reshuffleWeeklyPlan = () => {
    generateWeeklyPlan();
  };

  console.log("Rendering with recipes:", recipes);

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-center mb-6">
        <h1 className="text-2xl font-bold mr-8">Meal Planner</h1>
        <nav className="mt-4 sm:mt-0 flex-grow">
          <ul className="flex flex-wrap justify-start space-x-4">
            <li>
              <Button
                variant={activeTab === 'weeklyPlan' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('weeklyPlan')}
              >
                Weekly Meal Plan
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === 'recipes' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('recipes')}
              >
                Recipes
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === 'shoppingList' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('shoppingList')}
              >
                Shopping List
              </Button>
            </li>
          </ul>
        </nav>
      </div>
  
      {activeTab === 'weeklyPlan' && (
        <WeeklyPlanView 
          weeklyPlan={weeklyPlan} 
          handleReshuffleWeeklyPlan={handleReshuffleWeeklyPlan}
        />
      )}
  
      {activeTab === 'recipes' && (
        <RecipesView 
            recipes={recipes}
            setRecipes={setRecipes}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            editingRecipe={editingRecipe}
            setEditingRecipe={setEditingRecipe}
            newRecipe={newRecipe}
            setNewRecipe={setNewRecipe}
            handleTagChange={handleTagChange}
            handleSaveRecipe={handleSaveRecipe}
            exportRecipes={exportRecipes}
            importRecipes={importRecipes}
            handleEditRecipe={handleEditRecipe}
        />
      )}
  
      {activeTab === 'shoppingList' && (
        <ShoppingList weeklyPlan={weeklyPlan} />
      )}
    </div>
  );
};

export default MealPlanner;

const WeeklyPlanView = ({ weeklyPlan, handleReshuffleWeeklyPlan }) => {
    return (
      <div>
        <Button onClick={handleReshuffleWeeklyPlan} className="mb-4 flex items-center">
          <Shuffle className="mr-2" size={16} />
          Reshuffle Weekly Plan
        </Button>
        <Tabs defaultValue="weekly" className="w-full">
            <TabsList>
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
              <TabsTrigger value="daily">Daily View</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly">
            <div className="grid grid-cols-7 gap-4">
                {daysOfWeek.map(day => (
                <Card key={day} className="overflow-hidden">
                    <CardHeader className="p-4 pb-4">
                        <h3 className="text-lg font-semibold">{day}</h3>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                    {['Breakfast', 'Lunch', 'Dinner'].map((mealTime, index) => (
                        <div key={mealTime} className={`mb-6 ${index !== 0 ? 'mt-6 pt-4' : ''}`}>
                        <p className="font-medium mb-2 text-gray-500 text-sm">{mealTime}</p>
                        <RecipeDisplay 
                            recipe={weeklyPlan[day]?.[mealTime]} 
                            imageSize="medium" 
                            fullWidth={true} 
                        />
                        </div>
                    ))}
                    </CardContent>
                </Card>
                ))}
            </div>
            </TabsContent>
            <TabsContent value="daily">
              {daysOfWeek.map(day => (
                <Card key={day} className="mb-6">
                  <CardHeader>
                    <h3 className="text-xl font-semibold">{day}</h3>
                  </CardHeader>
                  <CardContent>
                    {['Breakfast', 'Lunch', 'Dinner'].map(mealTime => (
                      <div key={mealTime} className="mb-6">
                        <h4 className="text-lg text-gray-500 font-medium mb-3">{mealTime}</h4>
                        <RecipeDisplay recipe={weeklyPlan[day]?.[mealTime]} imageSize="large" />
                        {weeklyPlan[day]?.[mealTime] && (
                            <div className="mt-3">
                                <p className="mt-2"><strong>Ingredients:</strong> {weeklyPlan[day][mealTime].ingredients}</p>
                                <p className="mt-1"><strong>Instructions:</strong> {weeklyPlan[day][mealTime].instructions}</p>
                            </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
      </div>
    );
  };

  const RecipesView = ({ 
    recipes, 
    setRecipes, 
    isDialogOpen, 
    setIsDialogOpen, 
    editingRecipe, 
    setEditingRecipe, 
    newRecipe, 
    setNewRecipe, 
    handleTagChange, 
    handleSaveRecipe, 
    exportRecipes, 
    importRecipes, 
    handleEditRecipe 
  }) => {

    const [scrollPosition, setScrollPosition] = useState(0);
    const dialogRef = useRef(null);
  
    const openDialog = () => {
      setScrollPosition(window.pageYOffset);
      setIsDialogOpen(true);
    };
  
    const closeDialog = () => {
      setIsDialogOpen(false);
    };
  
    useEffect(() => {
      if (!isDialogOpen) {
        // Restore scroll position after dialog is closed
        window.scrollTo(0, scrollPosition);
      }
    }, [isDialogOpen, scrollPosition]);

    return (
      <div>
        <div className="mb-4 flex space-x-2">
          <Button className="mb-4" onClick={openDialog}>
            <PlusCircle className="mr-2" size={16} />
            Add Recipe
          </Button>

          <Button variant="ghost" className="mb-4" onClick={exportRecipes}>
                Export Recipes
          </Button>
            
          <label className="mb-4">
                <Button variant="ghost" as="span">
                    Import Recipes
                </Button>
                <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={importRecipes}
                />
          </label>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipes.map(recipe => (
              <Card key={recipe.id} className="relative">
                <Button 
                    variant="ghost" 
                    className="absolute top-2 right-2" 
                    onClick={() => {
                        setScrollPosition(window.pageYOffset);
                        handleEditRecipe(recipe);
                        setIsDialogOpen(true);
                      }}
                >
                    Edit
                </Button>
                {recipe.image && (
                    <img 
                        src={typeof recipe.image === 'string' ? recipe.image : URL.createObjectURL(recipe.image)} 
                        alt={recipe.title} 
                        className="w-full h-48 object-cover" 
                    />
                )}
                <CardHeader>
                  <h3 className="text-lg font-semibold">{recipe.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="font-medium ">Ingredients:</p>
                  <p>{recipe.ingredients}</p>
                  <p className="font-medium mt-2">Instructions:</p>
                  {/* <p>{recipe.instructions}</p> */}
                  <p style={{ whiteSpace: 'pre-line' }}>{recipe.instructions}</p>
                  <p className="font-medium mt-2">Tags:</p>
                  <p>{Object.entries(recipe.tags).map(([key, value]) => `${value}`).join(', ')}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {isDialogOpen && (
            <Dialog open={true} onOpenChange={closeDialog}>
            <DialogContent ref={dialogRef}>
                <DialogHeader>
                    <DialogTitle>{editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                    placeholder="Recipe Title"
                    value={newRecipe.title}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Input
                    placeholder="Ingredients (comma separated)"
                    value={newRecipe.ingredients}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, ingredients: e.target.value }))}
                    />
                    <textarea
                    placeholder="Instructions"
                    value={newRecipe.instructions}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, instructions: e.target.value }))}
                    className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {Object.entries(tagOptions).map(([tagType, options]) => (
                    <Select key={tagType} onValueChange={(value) => handleTagChange(tagType, value)}>
                        <SelectTrigger>
                        <SelectValue placeholder={`Select ${tagType}`} />
                        </SelectTrigger>
                        <SelectContent>
                        {options.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    ))}
                    <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                        setNewRecipe(prev => ({ ...prev, image: file }));
                        }
                    }}
                    />
                    <Button onClick={() => {
                        handleSaveRecipe();
                        closeDialog();
                        }}>
                        {editingRecipe ? 'Save Changes' : 'Add Recipe'}
                    </Button>
                </div>
            </DialogContent>
            </Dialog>
        )}
        </div>
  );
};

  const ShoppingList = ({ weeklyPlan }) => {
    const parseIngredients = (ingredients) => {
        return ingredients.split(',').map(item => item.trim());
    };
    
    const normalizeIngredient = (ingredient) => {
        // Remove quantities and units
        let normalized = ingredient.replace(/\d+(\.\d+)?(\s?[a-zA-Z]+)?/g, '').trim().toLowerCase();
        // Remove plural 's' if present
        normalized = normalized.replace(/s$/, '');
        return normalized;
    };
    
    const groupIngredients = (ingredients) => {
        const groups = {
            meat: [],
            fruits: [],
            veggies: [],
            grain: [],
            dairy: [],
            sauce: [],
            other: []
        };
    
        const uniqueIngredients = {};
    
        ingredients.forEach(ingredient => {
            const normalizedIngredient = normalizeIngredient(ingredient);
            if (!uniqueIngredients[normalizedIngredient]) {
                uniqueIngredients[normalizedIngredient] = ingredient;
            }
        });
    
        Object.values(uniqueIngredients).forEach(ingredient => {
            const normalizedIngredient = normalizeIngredient(ingredient);
            if (normalizedIngredient.match(/sauce|dressing|oil|vinegar|paste|mayo|kimchi|miso|extract/i)) {
                groups.sauce.push(ingredient);
            } else if (normalizedIngredient.match(/chicken|beef|pork|fish|turkey|lamb|salmon|tuna|crab|shrimp|sausage/i)) {
                groups.meat.push(ingredient);
            } else if (normalizedIngredient.match(/apple|banana|orange|berry|fruit|avocado|lemon|fig/i)) {
                groups.fruits.push(ingredient);
            } else if (normalizedIngredient.match(/lettuce|tomato|carrot|onion|pepper|vegetable|spinach|broccoli|cauliflower|garlic|eggplant|sprout|corn|pepper|kale|potato|cilantro|daikon|dill|cabbage|zucchini/i)) {
                groups.veggies.push(ingredient);
            } else if (normalizedIngredient.match(/rice|pasta|bread|cereal|oat|quinoa|seed|spaghetti|chickpea|walnut|sesame|peanut/i)) {
                groups.grain.push(ingredient);
            } else if (normalizedIngredient.match(/milk|cheese|yogurt|cream|egg/i)) {
                groups.dairy.push(ingredient);
            } else if (normalizedIngredient.match(/sauce|dressing|oil|vinegar|paste|mayo|kimchi|miso|extract/i)) {
                groups.sauce.push(ingredient);
            } else {
                groups.other.push(ingredient);
            }
        });
    
        // Sort ingredients alphabetically within each group
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => normalizeIngredient(a).localeCompare(normalizeIngredient(b)));
        });
    
        return groups;
    };

    // Process the weeklyPlan to get all ingredients
    const allIngredients = Object.values(weeklyPlan).flatMap(day => 
        Object.values(day).flatMap(meal => 
            meal ? parseIngredients(meal.ingredients) : []
        )
    );

    // Group the ingredients
    const groupedIngredients = groupIngredients(allIngredients);
  
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Shopping List</h2>
            {Object.entries(groupedIngredients).map(([group, items]) => (
                <div key={group} className="mb-4">
                    <h3 className="text-lg font-medium capitalize mb-2">{group}</h3>
                    <ul className="list-disc pl-5">
                        {items.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};