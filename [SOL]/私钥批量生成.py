# 链接服务器
from solana.rpc.api import Client
# DevNet: https://api.devnet.solana.com
# TestNet: https://api.testnet.solana.com
# MainNet: https://api.mainnet-beta.solana.com
# http_client = Client("https://api.devnet.solana.com")
# http_client = Client("https://api.testnet.solana.com")
http_client = Client("https://api.mainnet-beta.solana.com")

#字节码转私钥
from solana.rpc.api import Keypair
import time
import pandas as pd
from mnemonic import Mnemonic
from hashlib import sha256

#验证私钥是否跟公钥对应
from solana.rpc.api import Pubkey
public_key = Pubkey.from_string("24PNhTaNtomHhoy3fTRaMhAFCRj4uHqhZEEoWrKDbR5p")
keys = [174,47,154,16,202,193,206,113,199,190,53,133,169,175,31,56,222,53,138,189,224,216,117,173,10,149,53,45,73,251,237,246,15,185,186,82,177,240,148,69,241,227,167,80,141,89,240,121,121,35,172,247,68,251,226,218,48,63,176,109,168,89,238,135,]
keypair = Keypair.from_bytes(keys)
print("私钥",keypair)
print("公钥",keypair.pubkey(),"确认是否对应",keypair.pubkey()==public_key)
# 将提供的私钥列表转换为字节串
private_key_bytes = bytes(keys)
# 计算私钥的 SHA-256 哈希值
sha256_hash = sha256(private_key_bytes).digest()
# 使用 BIP39 将 SHA-256 哈希转换为助记词
mnemonic_phrase = Mnemonic("english").to_mnemonic(sha256_hash)
print(mnemonic_phrase)
#从助记词导出回私钥【从助记词生成种子】
seed = Mnemonic("english").to_entropy(mnemonic_phrase)
print("种子",seed)
keypair = Keypair.from_seed(seed)#从种子导回私
# 生成的助记词登录上去跟一开始的私钥对不上的原因：生成的路径不一样钥【貌似跟初始值对不上了】
print("私钥",keypair)



# keydf=pd.DataFrame({})
# # for n in range(1,10):
# while True:
#     # #生成私钥
#     keypair = Keypair()
#     print(keypair)
#     # # #对账户申请空投【仅仅支持测试网】
#     # req=http_client.request_airdrop(pubkey=keypair.pubkey(),lamports=int(0.01))
#     # print(req)
#     # #转换成公钥
#     publickey=keypair.pubkey()
#     # print(publickey)
#     # #生成json
#     # json=keypair.to_json()
#     # #生成字节码
#     # json=keypair.to_bytes_array()
#     # print(json)
#     # #转回私钥
#     # keypair = Keypair.from_bytes(raw_bytes=json)
#     # print(keypair)
#     # #查看余额
#     balance=http_client.get_balance(pubkey=keypair.pubkey())#获取账户的sol余额
#     print(balance.value,type(balance.value))#int格式
#     if balance.value!=int(0):
#         keydf=pd.concat([keydf,pd.DataFrame({"私钥":[str(keypair)],
#                                             "公钥":[str(publickey)],
#                                             #  "字节码":[json],
#                                             #  "空投结果":[req],
#                                             "余额":[balance.value],
#                                             })])
#         break
# # keydf.to_csv("密钥对.csv")
# ##导出密钥对的对应关系
# keydf.to_csv("/home/wth000/gitee/BRC20-ERC20-UI/[SOL]/密钥对.csv")
# ##仅仅导出私钥
# keypairs=keydf["私钥"].tolist()
# with open('/home/wth000/gitee/BRC20-ERC20-UI/[SOL]/私钥.txt', 'w') as file:
#     # 将列表中的每个元素写入文件中，并添加换行符
#     for item in keypairs:
#         file.write(item + ',\n')
# # print(keypairs)



# # 异步api
# import asyncio
# from solana.rpc.async_api import AsyncClient
# async def main():
#     async with AsyncClient("https://api.devnet.solana.com") as client:
#         res = await client.is_connected()
#     print(res)  # True
#     # Alternatively,close the client explicitly instead of using a context manager:
#     client = AsyncClient("https://api.devnet.solana.com")
#     res = await client.is_connected()
#     print(res)  # True
#     await client.close()
# asyncio.run(main())

# # websocket
# import asyncio
# from asyncstdlib import enumerate
# from solana.rpc.websocket_api import connect
# async def main():
#     async with connect("wss://api.devnet.solana.com") as websocket:
#         await websocket.logs_subscribe()
#         first_resp = await websocket.recv()
#         subscription_id = first_resp[0].result
#         next_resp = await websocket.recv()
#         print(next_resp)
#         await websocket.logs_unsubscribe(subscription_id)
#     # Alternatively,use the client as an infinite asynchronous iterator:
#     async with connect("wss://api.devnet.solana.com") as websocket:
#         await websocket.logs_subscribe()
#         first_resp = await websocket.recv()
#         subscription_id = first_resp[0].result
#         async for idx,msg in enumerate(websocket):
#             if idx == 3:
#                 break
#             print(msg)
#         await websocket.logs_unsubscribe(subscription_id)
# asyncio.run(main())

# #转账
# from solana.rpc.api import Transaction
# from solders.system_program import transfer, TransferParams
# from solana.rpc.api import Pubkey
# leading_zeros = [0] * 31
# sender, receiver = Keypair.from_seed(leading_zeros + [1]), Keypair.from_seed(leading_zeros + [2])
# print(sender, receiver)
# transaction = Transaction().add(transfer(TransferParams(
#     from_pubkey=sender.pubkey(),#公钥地址
#     to_pubkey=receiver.pubkey(),#公钥地址
#     lamports=1_000_000)
# ))
# result=http_client.send_transaction(transaction, sender)
# print(result)
