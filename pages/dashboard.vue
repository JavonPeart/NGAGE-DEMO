<script setup lang="ts">


definePageMeta({
    middleware: "auth"
});

</script>
<template>
    <div>
        <SearchComp/>
    </div>
</template>