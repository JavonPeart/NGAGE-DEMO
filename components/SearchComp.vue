<template>
  <div class="container">

    <!-- For checking progress and tallying search -->
    <div class="column blank">
      <div class="content">
        <h1 class="md-title">Query Categories</h1>
        <div class="housing">
          <ul>
            <li v-for="(count, category) in categories" :key="category">
              <p>{{ category }} [{{ count }}]</p>
            </li>
          </ul>
        </div>
      </div>
    </div>



    <!-- Handles the search engine -->
    <div class="column search">
      <div class="search-container">
        <h1 class="title">Earn & Learn</h1>
        <form class="search-form" @submit.prevent="handleSearch">
          <input v-model="qry" type="text" :placeholder="placeholderMessage" class="search-input" />
          <button type="submit" class="search-button">Search</button>
        </form>
      </div>
    </div>

    <!-- Manages Friends List -->
    <div class="column friends">
      <div class="friends-section">
        <form @submit.prevent="addFriend" class="friend-form">
          <input v-model="newFriend" type="text" placeholder="Add a friend" class="friend-input" />
          <button type="submit" class="friend-button">Add Friend</button>
        </form>
        <ul class="friends-list">
          <li v-for="friend in friends" :key="friend">
            {{ friend }}
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>


<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs, updateDoc, arrayUnion, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { useNuxtApp } from '#app';
import { getAuth } from '@firebase/auth';
import { query as qf, where as wf } from 'firebase/firestore';


// Data variables
const qry = ref('');
const retrieved = ref('');
const placeholderMessage = ref('');
const newFriend = ref('');
const friends = ref<string[]>([]);
const $firestore = getFirestore();
const queries = ref<string[]>([]);
const config = useRuntimeConfig();
const auth = getAuth();
const user = auth.currentUser;

const initializeUserCategories = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (userId) {
    const userId = user.uid;
    const userDocRef = doc($firestore, 'users', userId);
    const userData = {
      email: auth.currentUser.email,
      friends: [''],
      queries: [''],
      id: userId,
      categories: {
        Technology: 0,
        Art: 0,
        Science: 0,
        Finance: 0,
        Entertainment: 0,
        Education: 0,
        Travel: 0,
        Politics: 0,
        Lifestyle: 0,
        History: 0
      }
    };

    // Initialize the user's Firestore document with the categories
    await setDoc(userDocRef, userData);
  }
};


const placeholders = [
  'Search for jobs, learning resources...',
  'Find your next career opportunity...',
  'Explore new learning materials...',
  'Discover jobs and educational resources...'
];


async function addQuery(searchQuery: string) {
  try {
    const userId = user.uid;

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
    const userId = user.uid;

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

    const userId = user.uid;

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
      } else {
        console.error('Error:', response.message);
      }

      // Fetch friends after the search is performed

    }
  }
  fetchQueries();
  fetchCategoryCounts();

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



// Method to fetch friends from Firestore
const fetchFriends = async () => {
  try {
    const auth = getAuth();
    const userId = user.uid;

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
  const userId = user.uid;

  if (userId) {
    const userDocRef = doc($firestore, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      categories.value = docSnap.data().categories || {};
    }
  }
};

</script>

<style scoped>
.container {
  display: flex;
  justify-content: space-between;
}

.column.blank {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  max-height: fit-content;
}

.content {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #151515;
  border-radius: 8px;
  background-color: #fff;
}

.housing {
  margin-top: 20px;
}

.housing ul {
  list-style-type: none;
  padding-left: 0;
}

.housing ul li {
  padding: 10px;
  background-color: #eef;
  margin-bottom: 10px;
  border-radius: 4px;
}

.housing ul li p {
  margin: 0;
  color: #555;
  font-size: 16px;
}

.column {
  flex: 1;
  padding: 10px;
}

.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: #151515;
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
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}

.friends-section {
  margin-top: 20px;
}

.friend-form {
  display: flex;
  margin-bottom: 20px;
}

.friend-input {
  flex: 1;
  color: black;
  padding: 12px;
  font-size: 1.2rem;
  border: 2px solid #2c3e50;
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.friend-button {
  padding: 12px 20px;
  font-size: 1.2rem;
  background-color: #2c3e50;
  color: white;
  border: 2px solid #2c3e50;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.friend-button:hover {
  background-color: #34495e;
}

.friends-list {
  list-style-type: none;
  padding: 0;
}

.friends-list li {
  padding: 10px;
  color: #151515;
  border-bottom: 1px solid #ddd;
}
</style>
