const express = require('express');

const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');


const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; 
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {}; 
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


try {
   
    if (Object.keys(firebaseConfig).length === 0) {
        console.warn("Firebase config is empty. This might be expected in some Canvas environments where authentication is implicit.");
        admin.initializeApp(); 
    } else {
        
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig.serviceAccount)
        });
    }
} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK. This could be due to missing or incorrect credentials:", error);
    console.warn("Attempting to initialize Firebase without explicit credentials as a fallback. This might work in Canvas.");
    admin.initializeApp(); 
}


const db = admin.firestore();


const app = express();

const PORT = process.env.PORT || 3000;


app.use(cors());

app.use(express.json());

const masterMenu = {
    main_courses: [
        { name: "Chicken Tikka Masala", caloric_value: 600, operative_score: 9, spicy_level: 3, description: "A classic Indian chicken dish, rich and creamy." },
        { name: "Paneer Butter Masala", caloric_value: 550, operative_score: 8, spicy_level: 1, description: "Soft paneer cubes in a rich tomato-based gravy." },
        { name: "Dal Makhani", caloric_value: 480, operative_score: 7, spicy_level: 1, description: "Slow-cooked black lentils in a buttery sauce." },
        { name: "Vegetable Biryani", caloric_value: 520, operative_score: 8, spicy_level: 2, description: "Fragrant basmati rice cooked with mixed vegetables and spices." },
        { name: "Butter Chicken", caloric_value: 620, operative_score: 9, spicy_level: 2, description: "Tender chicken in a mild, creamy tomato sauce." },
        { name: "Mushroom Do Pyaza", caloric_value: 490, operative_score: 7, spicy_level: 1, description: "Mushrooms cooked with a generous amount of onions." },
        { name: "Lamb Rogan Josh", caloric_value: 650, operative_score: 9, spicy_level: 3, description: "Aromatic lamb curry from Kashmir." },
        { name: "Chana Masala", caloric_value: 450, operative_score: 6, spicy_level: 2, description: "Spicy chickpea curry." },
        { name: "Fish Curry", caloric_value: 580, operative_score: 8, spicy_level: 3, description: "Tangy and spicy fish in a coconut-based gravy." },
        { name: "Aloo Gobi", caloric_value: 400, operative_score: 6, spicy_level: 1, description: "Potatoes and cauliflower cooked with Indian spices." }
    ],
    side_dishes: [
        { name: "Garlic Naan", caloric_value: 250, operative_score: 7, spicy_level: 0, description: "Leavened flatbread with garlic." },
        { name: "Basmati Rice", caloric_value: 180, operative_score: 5, spicy_level: 0, description: "Fluffy long-grain rice." },
        { name: "Raita", caloric_value: 120, operative_score: 6, spicy_level: 0, description: "Yogurt dip with cucumber and mint." },
        { name: "Papadum", caloric_value: 80, operative_score: 4, spicy_level: 0, description: "Crispy lentil cracker." },
        { name: "Onion Bhaji", caloric_value: 200, operative_score: 7, spicy_level: 1, description: "Crispy fried onion fritters." },
        { name: "Cucumber Salad", caloric_value: 90, operative_score: 5, spicy_level: 0, description: "Fresh cucumber and tomato salad." },
        { name: "Samosa (2 pcs)", caloric_value: 300, operative_score: 8, spicy_level: 2, description: "Fried pastry with savory filling." },
        { name: "Mixed Vegetable Pickle", caloric_value: 50, operative_score: 4, spicy_level: 2, description: "Tangy and spicy pickled vegetables." }
    ],
    drinks: [
        { name: "Mango Lassi", caloric_value: 280, operative_score: 8, spicy_level: 0, description: "Sweet yogurt drink with mango." },
        { name: "Masala Chai", caloric_value: 150, operative_score: 7, spicy_level: 0, description: "Spiced Indian tea." },
        { name: "Fresh Lime Soda", caloric_value: 100, operative_score: 6, spicy_level: 0, description: "Refreshing lime and soda drink." },
        { name: "Jaljeera", caloric_value: 80, operative_score: 5, spicy_level: 1, description: "Spiced cumin drink." },
        { name: "Coca-Cola", caloric_value: 180, operative_score: 5, spicy_level: 0, description: "Classic carbonated soft drink." },
        { name: "Water Bottle", caloric_value: 0, operative_score: 1, spicy_level: 0, description: "Pure drinking water." },
        { name: "Sweet Lassi", caloric_value: 250, operative_score: 7, spicy_level: 0, description: "Traditional sweet yogurt drink." },
        { name: "Salted Lassi", caloric_value: 200, operative_score: 6, spicy_level: 0, description: "Savory yogurt drink with salt." }
    ]
};

function generateComboHash(comboItems) {
    
    const sortedNames = comboItems.map(item => item.name).sort().join('|');
    return crypto.createHash('sha256').update(sortedNames).digest('hex');
}


async function comboExistsInFirestore(comboHash) {
    try {
       
        const docRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('unique_combos').doc(comboHash);
        const doc = await docRef.get();
        return doc.exists; 
    } catch (error) {
        console.error("Error checking combo existence in Firestore. This might affect uniqueness checks:", error);
        
        return false;
    }
}

async function addComboToFirestore(comboHash, day, userId) {
    try {
        const docRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('unique_combos').doc(comboHash);
        await docRef.set({
            day: day, 
            timestamp: admin.firestore.FieldValue.serverTimestamp(), 
            userId: userId
        });
    } catch (error) {
        console.error("Error adding combo to Firestore. This combo might be generated again in the future:", error);
    }
}


function selectSessionMenu() {
    const selectedMainCourses = getRandomItems(masterMenu.main_courses, 5);
    const selectedSideDishes = getRandomItems(masterMenu.side_dishes, 4);
    const selectedDrinks = getRandomItems(masterMenu.drinks, 4);
    return { selectedMainCourses, selectedSideDishes, selectedDrinks };
}

function getRandomItems(arr, num) {
    
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}


function generateSingleCombo(availableMainCourses, availableSideDishes, availableDrinks, usedItems, dayProfile) {
    const MAX_ATTEMPTS = 1000; 
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        
        const mainCourse = getRandomItems(availableMainCourses, 1)[0];
        const sideDish = getRandomItems(availableSideDishes, 1)[0];
        const drink = getRandomItems(availableDrinks, 1)[0];

       
        if (!mainCourse || !sideDish || !drink) continue;

        const comboItems = [mainCourse, sideDish, drink];

        
        const comboItemNames = new Set(comboItems.map(item => item.name));
        if (comboItemNames.size !== 3) continue;

        
        const isAnyItemUsed = comboItems.some(item => usedItems.has(item.name));
        if (isAnyItemUsed) continue;

       
        const totalCaloricValue = mainCourse.caloric_value + sideDish.caloric_value + drink.caloric_value;

        
        if (totalCaloricValue < 800 || totalCaloricValue > 1000) continue;

        
        let passesDayProfile = true;
        switch (dayProfile) {
            case 'sweet':
                const sweetItems = comboItems.filter(item => item.spicy_level === 0 || item.name.includes('Lassi') || item.name.includes('Mango'));
                if (sweetItems.length < 2) passesDayProfile = false;
                
                if (comboItems.some(item => item.spicy_level > 1)) passesDayProfile = false;
                break;
            case 'spicy':
          
                const spicyItems = comboItems.filter(item => item.spicy_level > 0);
                if (spicyItems.length === 0) passesDayProfile = false;
                
                if (comboItems.every(item => item.spicy_level < 2)) passesDayProfile = false;
                break;
            case 'balanced':
                
                const nonSpicyCount = comboItems.filter(item => item.spicy_level === 0).length;
                const spicyCount = comboItems.filter(item => item.spicy_level > 0).length;
                if (nonSpicyCount < 1 || spicyCount < 1) passesDayProfile = false;
                
                if (comboItems.some(item => item.spicy_level === 3)) passesDayProfile = false;
                break;
            default:
                break;
        }

        if (!passesDayProfile) continue;

        const avgOperativeScore = (mainCourse.operative_score + sideDish.operative_score + drink.operative_score) / 3;

        
        let spicyProfileRemark;
        if (totalCaloricValue >= 800 && totalCaloricValue < 900) {
            spicyProfileRemark = "Mildly Caloric, Balanced Spice";
        } else if (totalCaloricValue >= 900 && totalCaloricValue <= 1000) {
            spicyProfileRemark = "Moderately Caloric, Robust Flavor"; 
        } else {
            spicyProfileRemark = "N/A"; 
        }

        
        return {
            main_course: mainCourse,
            side_dish: sideDish,
            drink: drink,
            total_caloric_value: totalCaloricValue,
            avg_operative_score: parseFloat(avgOperativeScore.toFixed(1)),
            spicy_profile: spicyProfileRemark
        };
    }
    return null; 
}


app.post('/generate-combos', async (req, res) => {
    const { day } = req.body; 
    const userId = req.headers['x-user-id'] || crypto.randomUUID();

    
    if (!day) {
        return res.status(400).json({ error: "Please specify a day to generate combos for." });
    }

    const generatedCombos = [];
    const usedItemsInDay = new Set();
   
    const usedComboHashes = new Set();

    
    let dayProfileRemark = "A balanced selection of flavors.";
    let dayProfileType = "balanced"; 
    switch (day.toLowerCase()) {
        case 'monday':
            dayProfileRemark = "Emphasizing a 'Very Sweet' profile to start the week, offering delightful and comforting flavors.";
            dayProfileType = "sweet";
            break;
        case 'friday':
            dayProfileRemark = "A 'Spicy' profile to kick off the weekend, featuring bold and exciting tastes!";
            dayProfileType = "spicy";
            break;
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
            dayProfileRemark = "A 'Balanced' profile for a steady mid-week experience, ensuring a harmonious blend of flavors.";
            dayProfileType = "balanced";
            break;
        default:
            dayProfileRemark = "A general balanced selection, offering a satisfying variety for any day.";
            dayProfileType = "balanced";
            break;
    }

    
    for (let i = 0; i < 3; i++) {
        let combo = null;
        let attempts = 0;
        const MAX_COMBO_ATTEMPTS = 5000; 

       
        const { selectedMainCourses, selectedSideDishes, selectedDrinks } = selectSessionMenu();

        
        while (combo === null && attempts < MAX_COMBO_ATTEMPTS) {
            const potentialCombo = generateSingleCombo(
                selectedMainCourses,
                selectedSideDishes,
                selectedDrinks,
                usedItemsInDay, 
                dayProfileType 
            );

            if (potentialCombo) {
               
                const comboHash = generateComboHash([
                    potentialCombo.main_course,
                    potentialCombo.side_dish,
                    potentialCombo.drink
                ]);

                
                const existsGlobally = await comboExistsInFirestore(comboHash);
                
                const existsLocally = usedComboHashes.has(comboHash);

               
                if (!existsGlobally && !existsLocally) {
                    combo = { ...potentialCombo, combo_id: comboHash }; 
                    await addComboToFirestore(comboHash, day, userId); 
                    usedComboHashes.add(comboHash); 

                    
                    usedItemsInDay.add(potentialCombo.main_course.name);
                    usedItemsInDay.add(potentialCombo.side_dish.name);
                    usedItemsInDay.add(potentialCombo.drink.name);
                }
            }
            attempts++;
        }

        
        if (combo) {
            generatedCombos.push(combo);
        } else {
           
            return res.status(500).json({
                error: `We couldn't generate all three unique combos for ${day}. Only ${generatedCombos.length} combos were created. Please try a different day or contact support.`,
                details: "This might happen if the menu is too restrictive or all unique combinations have been exhausted.",
                combos: generatedCombos,
                profile_remarks: dayProfileRemark
            });
        }
    }

    const totalCals = generatedCombos.map(c => c.total_caloric_value);
    const avgOps = generatedCombos.map(c => c.avg_operative_score);

    const minCal = Math.min(...totalCals);
    const maxCal = Math.max(...totalCals);
    const minOp = Math.min(...avgOps);
    const maxOp = Math.max(...avgOps);

    dayProfileRemark += ` All combos for today feature total calories ranging from ${minCal} to ${maxCal} kcal, and average operative scores between ${minOp.toFixed(1)} and ${maxOp.toFixed(1)}, ensuring a consistent offering.`;

    
    res.json({
        date: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        profile_remarks: dayProfileRemark,
        combos: generatedCombos
    });
});


app.listen(PORT, () => {
    console.log(`Backend server successfully started and listening on http://localhost:${PORT}`);
});
