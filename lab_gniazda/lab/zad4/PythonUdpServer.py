import socket

serverPort = 9009
serverSocket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
serverSocket.bind(('', serverPort))
buff = []

print('PYTHON UDP SERVER')

while True:

    buff, address = serverSocket.recvfrom(1024)
    msg = str(buff, 'utf-8')
    print("python udp server received msg: " + msg)

    if 'java' in msg.lower():
        msg = 'Pong Java'
    elif 'python' in msg.lower():
        msg = 'Pong Python'
    else:
        msg = 'Pong'

    serverSocket.sendto(bytes(msg, 'utf-8'), address)
