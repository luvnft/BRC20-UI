<template>
  <iframe v-if="isLoggedIn" width="100%" height="100%" src="https://huggingface.co/spaces/fffiloni/zeroscope"
    >GPT</iframe
  >
  <div v-else class="login-container">
    <ThemeSwitch class="theme-switch" />
    <div class="login-card">
      <div class="content">
        <div class="title">
          <img src="@/assets/layout/logo-text-2.png" />
        </div>
        <el-form @submit.prevent="login">
          <el-form-item prop="username">
            <el-input v-model="username" placeholder="用户名" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="password" placeholder="密码" />
          </el-form-item>
          <el-button type="primary" size="large" @click="login"> 登 录 </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      isLoggedIn: false,
      username: "",
      password: ""
    }
  },
  methods: {
    login() {
      if (this.username === "admin" && this.password === "000000") {
        this.isLoggedIn = true
      } else {
        // 用户名或密码错误，可以在此处添加相关提示逻辑
        console.log("用户名或密码错误")
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  .theme-switch {
    position: fixed;
    top: 5%;
    right: 5%;
    cursor: pointer;
  }
  .login-card {
    width: 480px;
    border-radius: 20px;
    box-shadow: 0 0 10px #dcdfe6;
    background-color: #fff;
    overflow: hidden;
    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 150px;
      img {
        height: 100%;
      }
    }
    .content {
      padding: 20px 50px 50px 50px;
      :deep(.el-input-group__append) {
        padding: 0;
        overflow: hidden;
        .el-image {
          width: 100px;
          height: 40px;
          border-left: 0px;
          user-select: none;
          cursor: pointer;
          text-align: center;
        }
      }
      .el-button {
        width: 100%;
        margin-top: 10px;
      }
    }
  }
}
</style>
