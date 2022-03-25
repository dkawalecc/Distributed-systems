import socket
import threading
import config

from termcolor import colored

clients = {}


def accept_tcp_connections(server_socket):
    while True:
        tcp_socket, address = server_socket.accept()
        threading.Thread(target=client_handler, args=(tcp_socket, address)).start()
        print(f"[ACTIVE CHATTERS] {threading.active_count() - 3}")


def client_handler(tcp_socket, address):
    nickname = tcp_socket.recv(config.BUF_SIZE).decode('utf-8')
    clients[nickname] = tcp_socket, address
    print(colored(f'New client {nickname} on {address}', 'blue'))

    while True:
        msg = tcp_socket.recv(config.BUF_SIZE)
        [first, msg] = msg.decode('utf-8').split(' ', 1)
        print(f'[TCP] {msg}')
        if msg in ('!q', '!quit'):
            clients.pop(nickname)
            break

        for nick, client in clients.items():
            sock, _ = client
            if nick != nickname:
                try:
                    sock.send(f'{first} {msg}'.encode('utf-8'))
                except BrokenPipeError:
                    print(f'{nick} message caused an error')
                    sock.close()
                    sock.pop(nick)
                    continue

    print(colored(f'Client {nickname} from {address} disconnected fromm the server', 'red'))
    tcp_socket.close()
    # print(f"[ACTIVE CHATTERS] {threading.active_count() - 3}")


def udp_receive_handler(udp_socket):
    while True:
        msg, addr = udp_socket.recvfrom(config.UDP_BUF_SIZE)

        for nick, client in clients.items():
            _, client_addr = client
            if client_addr != addr:
                udp_socket.sendto(msg, client_addr)

        msg = msg.decode('utf-8')
        print(f'[UDP] {msg}')


if __name__ == '__main__':
    print(colored('[STARTING] PYTHON CHAT SERVER', 'green'))

    # tcp server config
    tcp_server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP)
    tcp_server_socket.bind(config.server_address)

    tcp_server_socket.listen(6)

    # udp server config
    udp_server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    udp_server_socket.bind(config.server_address)

    threading.Thread(target=accept_tcp_connections, args=(tcp_server_socket,), daemon=True).start()
    threading.Thread(target=udp_receive_handler, args=(udp_server_socket,), daemon=True).start()

    try:
        while True:
            # if KeyboardInterrupt:
            #     break
            pass
    except:
        for n, c in clients.items():
            s, ad = c
            s.close()

            print(colored(f'Client {n} from {ad} disconnected fromm the server', 'red'))

        tcp_server_socket.close()
        udp_server_socket.close()
        print(colored('[SHUTDOWN] PYTHON CHAT SERVER SHUTDOWN', 'red'))
