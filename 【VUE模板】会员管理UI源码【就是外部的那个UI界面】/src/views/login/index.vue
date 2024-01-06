<script lang="ts" setup>
import { useRouter } from "vue-router"
import { useUserStore } from "@/store/modules/user"
const router = useRouter()
useUserStore()
  .login({
    username: "admin",
    password: ""
  })
  .then(() => {
    router.push({ path: "/" })
  })
</script>
