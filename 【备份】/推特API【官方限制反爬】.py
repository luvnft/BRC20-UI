from twython import Twython
APP_KEY = "7F03ZsSYANd9aRyW5OUhWqZtc"
APP_SECRET = "tUghd5X3i9AIdZxH7tcZzTw8zXlxKZE4CgimHoY5aKGr6FyJBi"
twitter = Twython(APP_KEY, APP_SECRET)
auth = twitter.get_authentication_tokens(callback_url='http://mysite.com/callback')
print(auth)



# 替换成你的 Twitter 开发者密钥
API_KEY = "7F03ZsSYANd9aRyW5OUhWqZtc"
API_SECRET = "tUghd5X3i9AIdZxH7tcZzTw8zXlxKZE4CgimHoY5aKGr6FyJBi"
ACCESS_TOKEN = '773393572724899840-vEDseT1cWUzdxVShb1hmfSu5EJYLE3I'
ACCESS_TOKEN_SECRET = 'zFjngKXAWaWaKexvaRXx5t7xPQCpJTWbj7K3RBofTAlRm'
# 创建 Twython 对象
twitter = Twython(app_key=API_KEY,
                  app_secret=API_SECRET,
                  oauth_token=ACCESS_TOKEN,
                  oauth_token_secret=ACCESS_TOKEN_SECRET,
                #   access_token="utMVuLOp3dDXpIQ3VIirzEsGLciUHFfnySLTcwQ4WzLS1c-ViC",
                  )
# 获取用户的基本信息
user_info = twitter.show_user(screen_name='twitter')
# 打印用户信息
print(user_info)
# # 发布一条推文
# twitter.update_status(status='Hello, Twitter API!')
# # 获取用户时间线
# timeline = twitter.get_home_timeline()
# # 打印时间线上的每一条推文
# for status in timeline:
#     print(status['text'])