<template>
    <div>
        <Navbar/>
        <slot class="container"/>
    </div>
</template>



<style scoped>
.container {
  display: flex;
  justify-content: space-between;
}

</style>