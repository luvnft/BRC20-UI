# 链接服务器
from solana.rpc.api import Client
# DevNet: https://api.devnet.solana.com
# TestNet: https://api.testnet.solana.com
# MainNet: https://api.mainnet-beta.solana.com
# http_client = Client("https://api.devnet.solana.com")
http_client = Client("https://api.testnet.solana.com")
# http_client = Client("https://api.mainnet-beta.solana.com")

#字节码转私钥
from solana.rpc.api import Keypair
import pandas as pd
keydf=pd.DataFrame({})
for n in range(1,100):
    keypair = Keypair()#生成私钥
    # print(keypair)
    publickey=keypair.pubkey()#转换成公钥
    # print(publickey)
    keydf=pd.concat([keydf,pd.DataFrame({"私钥":[str(keypair)],"公钥":[str(publickey)]})])
# keydf.to_csv("密钥对.csv")
##导出密钥对的对应关系
keydf.to_csv("/home/wth000/gitee/BRC20-ERC20-UI/[SOL]/密钥对.csv")
##仅仅导出私钥
keypairs=keydf["私钥"].tolist()
with open('/home/wth000/gitee/BRC20-ERC20-UI/[SOL]/私钥.txt', 'w') as file:
    # 将列表中的每个元素写入文件中，并添加换行符
    for item in keypairs:
        file.write(item + ',\n')
# print(keypairs)