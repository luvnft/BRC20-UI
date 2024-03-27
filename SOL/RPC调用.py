# # pip install bip_utils
# from bip_utils import Bip39SeedGenerator, Bip39MnemonicGenerator, Bip39WordsNum
# # 生成助记词
# mnemonic = "pill tomorrow foster begin walnut borrow virtual kick shift mutual shoe scatter"
# # 将助记词转换为种子
# seed_bytes = Bip39SeedGenerator(mnemonic).Generate()
# print(seed_bytes)

# pip install solana
# import solana
import time
# from solana.rpc.api import *
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

# 从Base58字符串：
b58_string = "5MaiiCavjCmn9Hs1o3eznqDEhRwxo7pXiAYez7keQUviUkauRiTMD8DrESdrNjN8zd9mTmVhRvBJeg5vhyvgrAhG"
keypair = Keypair.from_base58_string(b58_string)
print(keypair)#理论上这个keypair表示的是私钥
from solana.rpc.api import Pubkey
print(keypair.pubkey())#输出公钥
# time.sleep(100)

# 从字节中：
# secret_key=(
#     [174,47,154,16,202,193,206,113,199,190,53,133,169,175,31,56,222,53,138,189,224,216,117,173,10,149,53,45,73,251,237,246,15,185,186,82,177,240,148,69,241,227,167,80,141,89,240,121,121,35,172,247,68,251,226,218,48,63,176,109,168,89,238,135]
#     )
secret_key=(
    [130,233,227,101,130,130,91,155,206,159,247,203,201,17,174,119,89,193,138,129,118,81,59,188,8,189,173,240,189,108,228,235,17,189,127,1,22,211,99,60,242,19,27,130,178,148,81,116,178,230,137,37,20,129,229,106,37,162,192,247,49,57,2,18]
    )
# secret_key=(
#     [67,201,54,86,54,242,139,128,197,197,18,8,59,83,72,94,224,238,179,89,26,218,170,112,41,35,239,56,81,67,4,40,64,50,2,18,143,136,235,199,215,69,170,144,225,126,155,178,6,255,95,168,138,62,228,76,12,195,144,186,61,0,98,82]
#     )
# keypair = Keypair.from_json(raw=secret_key)
keypair = Keypair.from_bytes(raw_bytes=secret_key)
print(keypair,keypair.to_json(),keypair.pubkey())

# #请求空投
# req=http_client.request_airdrop(pubkey=keypair.pubkey(),lamports=1)
# print(req)
# balance=http_client.get_token_supply(pubkey=keypair.pubkey())#获取某个币的供应信息
# balance=http_client.get_token_account_balance(pubkey=keypair.pubkey())#获取某个币的余额信息
balance=http_client.get_balance(pubkey=keypair.pubkey())#获取账户的sol余额
print(balance)

# # 生成新的密钥对
# keypair = Keypair()
# print(keypair)

# #验证私钥是否跟公钥对应
# from solana.rpc.api import Pubkey
# public_key = Pubkey.from_string("24PNhTaNtomHhoy3fTRaMhAFCRj4uHqhZEEoWrKDbR5p")
# keys = [174,47,154,16,202,193,206,113,199,190,53,133,169,175,31,56,222,53,138,189,224,216,117,173,10,149,53,45,73,251,237,246,15,185,186,82,177,240,148,69,241,227,167,80,141,89,240,121,121,35,172,247,68,251,226,218,48,63,176,109,168,89,238,135,]
# keypair = Keypair.from_bytes(keys)
# print(keypair.pubkey() == public_key)

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
