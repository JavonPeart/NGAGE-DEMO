<template>
  <div class="container">

    <!-- For checking progress and tallying search -->
    <div class="column categories">
      <div class="categories-section">
        <h1 class="categories-title">Search Categories</h1>
        <div class="housing">
          <ul class="categories-list">
            <li v-for="(count, category) in categories" :key="category" class="category-item">
              <span class="category-name">{{ category }}</span>
              <span class="category-count">[{{ count }}]</span>
            </li>
          </ul>
        </div>
      </div>
    </div>


    <!-- Handles the search engine -->
    <div class="column search">
      <div class="search-container">
        <h1 class="title">Dare To Learn</h1>
        <form class="search-form" @submit.prevent="handleSearch">
          <input v-model="qry" type="text" :placeholder="placeholderMessage" class="search-input" />
          <button type="submit" class="search-button">Search</button>
        </form>
        <a
          v-if="hasCategoryReachedTen"
          href="https://zty.pe/"
          target="_blank"
        >
          <button class="unlock-button" :class="{ unlocked: hasCategoryReachedTen }">Reach 10 in a topic to unlock!</button>
        </a>
        <button
          v-else
          class="unlock-button"
          :disabled="true"
        >
          Reach 10 in a topic to unlock!
        </button>
      </div>
    </div>




    <!-- Manages Friends List -->
    <div class="column friends">
      <div class="friends-section">
        <form @submit.prevent="addFriend" class="friend-form">
          <input v-model="newFriend" type="text" placeholder="Add a friend" class="friend-input" />
          <button type="submit" class="friend-button">Add Friend</button>
        </form>
        <h3 class="friends-title">Your Friends</h3>
        <ul class="friends-list">
          <li v-for="friend in friends" :key="friend" class="friend-item">
            {{ friend }}
            <button class="del-btn" @click="deleteFriend(friend)">Delete</button>
          </li>
        </ul>
      </div>
    </div>
  </div>

</template>


<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs, updateDoc, arrayUnion, doc, getDoc, setDoc, increment, arrayRemove } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { useNuxtApp } from '#app';
import { getAuth } from '@firebase/auth';
import { query as qf, where as wf } from 'firebase/firestore';


// Data variables
const qry = ref('');
const retrieved = ref('');
const placeholderMessage = ref('');
const newFriend = ref('');
// const friends = ref<string[]>([]);
const $firestore = getFirestore();
const queries = ref<string[]>([]);
const config = useRuntimeConfig();
const auth = getAuth();
const user = auth.currentUser;
const friends = ref([]);
const hasCategoryReachedTen = ref(false);


const placeholders = [
  'Search for jobs, learning resources...',
  'Find your next career opportunity...',
  'Explore new learning materials...',
  'Discover jobs and educational resources...'
];

const checkCategoryTally = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;

  if (userId) {
    const userDocRef = doc($firestore, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const categories = docSnap.data().categories || {};
      hasCategoryReachedTen.value = Object.values(categories).some(count => count >= 10);
    }
  }
};

watch(hasCategoryReachedTen, (newValue) => {
  updateButtonColor(newValue);
});


const updateButtonColor = (hasReachedTen: boolean) => {
  const button = document.querySelector('.unlock-button');
  if (button) {
    if (hasReachedTen) {
      button.style.backgroundColor = '#FFC107'; // Yellow color when a category reaches 10
    } else {
      button.style.backgroundColor = '#B0B0B0'; // Grey color by default
    }
  }
};

async function addQuery(searchQuery: string) {
  try {
    const userId = user?.uid;

    if (qry.value) {
      const queriesDoc = doc($firestore, 'users', userId);

      await updateDoc(queriesDoc, {
        queries: arrayUnion(searchQuery)
      });
    }
  } catch (error) {
    console.error('Error adding query: ', error);
  }
};


const fetchQueries = async () => {
  try {
    const auth = getAuth();
    const userId = user?.uid;

    if (userId) {
      const userDocRef = doc($firestore, 'users', userId);

      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        queries.value = docSnap.data().queries || [];
        console.log('Fetched Queries: ', queries.value);
      }
    }
  } catch (error) {
    console.error('Error fetching queries: ', error);
  }
};


const updateCategoryCount = async (userId, category) => {
  const userDocRef = doc($firestore, 'users', userId);
  await updateDoc(userDocRef, {
    [`categories.${category}`]: increment(1)
  });
};


// Method to handle the search logic
const handleSearch = async () => {
  if (qry.value) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(qry.value)}`;
    window.open(searchUrl, '_blank');

    await fetchFriends();
    await addQuery(qry.value);
    await fetchQueries();

    const userId = user?.uid;
 
    if (userId) {

      const response = await $fetch('http://127.0.0.1:5000/userId', {
        method: 'POST',
        body: {
          userId,
          query: qry.value
        },
      });

      if (response.success) {
        const category = response.category;
        await updateCategoryCount(userId, category);
        console.log('Categorized query:', category);
        
        checkCategoryTally();
        updateButtonColor(hasCategoryReachedTen.value);
        
      } else {
        console.error('Error:', response.message);
      }

      // Fetch friends after the search is performed

    }
  }
  fetchQueries();
  fetchCategoryCounts();
  checkCategoryTally();
  updateButtonColor(hasCategoryReachedTen.value);

};


// Method to set a random placeholder message
const setRandomPlaceholder = () => {
  const randomIndex = Math.floor(Math.random() * placeholders.length);
  placeholderMessage.value = placeholders[randomIndex];
};


// Set a random placeholder message when the component is mounted
onMounted(() => {
  setRandomPlaceholder();
  fetchFriends();
  fetchQueries();
  fetchCategoryCounts();
  checkCategoryTally();
  updateButtonColor(hasCategoryReachedTen.value);
});


// Method to add a friend
const addFriend = async () => {
  const auth = getAuth();
  const newFriendUsername = newFriend.value.trim(); // Assuming `newFriend` is a ref tied to the input field

  // Ensure the input is not empty
  if (newFriendUsername) {
    try {
      // Step 1: Check if the entered name is a valid username in Firestore
      const usersRef = collection($firestore, 'users'); // Reference to the 'users' collection
      const q = qf(usersRef, wf('username', '==', newFriendUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Step 2: Add the friend's user ID to the logged-in user's friends list
        const friendDoc = querySnapshot.docs[0]; // Assuming usernames are unique
        const friendUserId = friendDoc.id;

        const userId = auth?.currentUser?.uid;
        if (userId) {
          const userDocRef = doc($firestore, 'users', userId);
          await updateDoc(userDocRef, {
            friends: arrayUnion(`${newFriendUsername} (${friendDoc.data().email})`) // Add friend's ID to the 'friends' array
          });

          newFriend.value = ''; // Clear the input field
          fetchFriends(); // Refresh the list of friends
        } else {
          console.error('User is not logged in');
          alert('You must be logged in to add friends.');
        }
      } else {
        console.error('Username not found');
        alert('Username not found. Please check the username and try again.');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('An error occurred while trying to add the friend. Please try again later.');
    }
  } else {
    console.error('Please enter a username');
    alert('Please enter a username to add a friend.');

  }
};

const deleteFriend = async (friendId: string) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;

  if (userId) {
    try {
      const userDocRef = doc($firestore, 'users', userId);
      await updateDoc(userDocRef, {
        friends: arrayRemove(friendId)
      });

      fetchFriends(); // Refresh the list of friends after deletion
      console.log(`Friend with ID ${friendId} removed successfully.`);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  } else {
    console.error('User is not logged in.');
  }
};




// Method to fetch friends from Firestore
const fetchFriends = async () => {
  try {
    const auth = getAuth();
    const userId = user?.uid;

    if (userId) {
      const userDocRef = doc($firestore, 'users', userId);

      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        friends.value = docSnap.data().friends || [];
      }
    }
  } catch (error) {
    console.error('Error fetching friends: ', error);
  }
};


const categories = ref({});

const fetchCategoryCounts = async () => {
  const auth = getAuth();
  const user = auth.currentUser; // Ensure auth.currentUser is available
  const userId = user?.uid;


  if (userId) {
    const userDocRef = doc($firestore, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const fetchedCategories = docSnap.data().categories || {};

      // Sort the categories by highest count
      const sortedCategories = Object.entries(fetchedCategories)
        .sort(([, countA], [, countB]) => countB - countA)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});

      categories.value = sortedCategories;
    }
  }
};



</script>

<style scoped>
.container {
  display: flex;
  justify-content: space-between;

}

/* Container */
.column.categories {
  max-width: 400px;
  /* Narrower width */
  margin: 20px auto;
  padding: 15px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.categories-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Title Styles */
.categories-title {
  font-size: 22px;
  font-weight: bold;
  color: #444;
  margin-bottom: 15px;
}

/* Categories List */
.categories-list {
  list-style-type: none;
  padding: 0;
  width: 100%;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f1f1f1;
  border-radius: 5px;
  font-size: 15px;
  transition: background-color 0.3s;
  width: 12vw;
}

.category-item:hover {
  background-color: #e9e9e9;
}

.unlock-button {
  margin-top: 20px;
  padding: 15px 20px;
  font-size: 18px;
  color: white;
  background-color: #B0B0B0;
  /* Grey by default */
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.unlock-button:hover {
  background-color: #A0A0A0;
  /* Slightly darker grey on hover */
}

/* Additional state when a category reaches 10 */
.unlock-button.unlocked {
  background-color: #FFC107;
  /* Yellow when unlocked */
}

.unlock-button.unlocked:hover {
  background-color: #FFB300;
  /* Slightly darker yellow on hover */
}

/* Category Name on the Left */
.category-name {
  flex: 1;
  color: #333;
  text-align: left;
}

/* Category Count on the Right */
.category-count {
  flex: 0;
  font-weight: bold;
  color: #333;
  text-align: right;
}



.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-family: 'Orbitron', sans-serif;
  font-size: 4rem;
  /* Increase the size */
  font-weight: bold;
  margin-bottom: 20px;
  color: inline-gradient(45deg, #f3ec78, #af4261);
  /* Add a gradient color */
  text-align: center;
  /* Center-align the title */
  letter-spacing: 2px;
  /* Add some spacing between letters */
  text-transform: uppercase;
  /* Make the text uppercase */
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  /* Add a subtle shadow for depth */
  display: inline-block;
}


.search-form {
  display: flex;
  width: 100%;
  max-width: 600px;
}

.search-input {
  flex: 1;
  color: black;
  padding: 12px;
  font-size: 1.2rem;
  border: 2px solid #2c3e50;
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.search-button {
  padding: 12px 20px;
  font-size: 1.2rem;
  background-color: #2c3e50;
  color: white;
  border: 2px solid #2c3e50;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.search-button:hover {
  background-color: #34495e;
}

.column.search {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40vh;
}

.search-container {
  text-align: center;
  /* Center the text inside the container */
}

.column.friends {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.friends-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Form Styles */
.friend-form {
  display: flex;
  width: 100%;
  margin-bottom: 20px;
}

.friend-input {
  flex: 1;
  padding: 8px 12px;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  margin-right: 10px;
}

.friend-button {
  background-color: #4CAF50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.friend-button:hover {
  background-color: #45a049;
}

/* Friends List */
.friends-title {
  font-size: 20px;
  margin-bottom: 10px;
  color: #444;
}

.friends-list {
  list-style-type: none;
  padding: 0;
  width: 100%;
}

.friend-item {
  display: flex;
  color: #333;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 8px;
  background-color: #f1f1f1;
  border-radius: 5px;
  font-size: 16px;
  transition: background-color 0.3s;
}

.friend-item:hover {
  background-color: #e9e9e9;
}

.del-btn {
  background-color: #ff4d4d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.del-btn:hover {
  background-color: #ff3333;
}
</style>
