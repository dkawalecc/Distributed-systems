import socket
import struct
import threading

from select import select
from termcolor import colored

import config
import art

online = True


def receive_handler(tcp_socket, udp_socket, mcast_socket):
    while online:
        check_sockets, _, _ = select([tcp_socket, udp_socket, mcast_socket], [], [])

        # tcp
        if online and tcp_socket in check_sockets:
            buff = tcp_socket.recv(config.BUF_SIZE)
            msg = buff.decode('utf-8')
            print(colored(f'{msg}', 'magenta'))

        # udp
        if online and udp_socket in check_sockets:
            buff, _ = udp_socket.recvfrom(config.UDP_BUF_SIZE)
            msg = buff.decode('utf-8')
            print(colored(f'{msg}', 'magenta'))

        # mcast
        if online and mcast_socket in check_sockets:
            buff, address = mcast_socket.recvfrom(config.UDP_BUF_SIZE)
            msg = buff.decode('utf-8')
            # wrong color when receiver is also sender
            print(colored(f'{msg}', 'magenta'))

    tcp_socket.close()
    udp_socket.close()
    mcast_socket.close()


def send_handler(tcp_socket, udp_socket, mcast_sender, nick):
    global online
    while online:
        msg = input('')
        # msg = message.split(' ', 1).decode('utf-8')

        if msg in ('!q', '!quit'):
            online = False
            print(colored('[SHUTDOWN] PYTHON CHAT CLIENT SHUTDOWN', 'red'))
            tcp_socket.send(f'{nick}> {msg}'.encode('utf-8'))
            # udp_socket.sendto(f'{nick}> {msg}'.encode('utf-8'), config.server_address)
            # mcast_sender.sendto(f'{nick}> {msg}'.encode('utf-8'), config.multi_address)
        elif msg in ('!u', '!udp'):
            m = f'{nick}>\n{art.image}'
            udp_socket.sendto(bytes(m, 'utf-8'), config.server_address)
            # udp_socket.sendto(art.image.encode('utf-8'), config.multi_address)
        elif msg in ('!m', '!mcast'):
            m = f'{nick}>\n{art.image}'
            mcast_sender.sendto(bytes(m, 'utf-8'), config.multi_address)
            # mcast_sender.sendto(art.image.encode('utf-8'), config.multi_address)
        else:
            print(colored(f'{nick}> {msg}', 'yellow'))
            tcp_socket.sendall(f'{nick}> {msg}'.encode('utf-8'))


if __name__ == '__main__':
    print(colored('[STARTING] PYTHON CHAT CLIENT', 'green'))

    print(colored(
        """
        !q or !quit to disconnect (eventually CTRL + C)
        TCP message: [your_message]
        UDP message: !u
        alternative - !udp
        MULTICAST message: !m
        alternative - !mcast
        """, "cyan")
    )

    while True:
        try:
            nickname = input('Enter your nickname: ')
        except KeyboardInterrupt:
            raise SystemExit
        if nickname:
            break

    # create tcp client socket
    tcp_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP)
    try:
        tcp_sock.connect(config.server_address)
    except ConnectionRefusedError:
        print(colored('Connecting to server leads to an error', 'red'))
        raise SystemExit
    _, tcp_port = tcp_sock.getsockname()
    tcp_sock.send(f'{nickname}'.encode('utf-8'))

    # create udp client socket
    udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    udp_sock.bind(('', tcp_port))
    # udp_sock.sendto(f'{nickname}'.encode('utf-8'), config.server_address)

    # create multicast server socket
    mcast_sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    mcast_sender.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)

    # create multicast client socket
    mcast_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    mcast_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    mcast_sock.bind(('', config.multi_port))

    group = socket.inet_aton(config.multi_ip)
    mreq = struct.pack('4sL', group, socket.INADDR_ANY)
    mcast_sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

    threading.Thread(target=receive_handler, args=(tcp_sock, udp_sock, mcast_sock), daemon=True).start()
    threading.Thread(target=send_handler, args=(tcp_sock, udp_sock, mcast_sender, nickname)).start()

    while online:
        pass
