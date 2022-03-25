import socket

serverIP = "127.0.0.1"
serverPort = 9009
# msg = "Ping Python Udp!"
msg_bytes = (300).to_bytes(4, byteorder='little')

print('PYTHON UDP CLIENT')
client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
client.sendto(msg_bytes, (serverIP, serverPort))

buff, _ = client.recvfrom(4)
print(int.from_bytes(buff, byteorder='little'))
