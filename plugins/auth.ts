export default defineNuxtPlugin(() => {
    addRouteMiddleware('auth', () => {
        const { $auth } = useNuxtApp()
        if (!($auth as any)?.currentUser?.uid) {
            return navigateTo("/")
        }
    })
})