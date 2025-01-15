'use client';
import Image from 'next/image';
import Avatar from '@public/avatar.png';
// Change SVG imports to Image components
import DiscordLogo from '@public/logos/discord.svg';
import GitHubLogo from '@public/logos/github.svg';
import TwitterLogo from '@public/logos/twitter.svg';
import TelegramLogo from '@public/logos/telegram.svg';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Repository = {
    name: string;
    description: string;
    language: string;
    stars: number;
    image: string;
};

const repositories: Repository[] = [
    {
        name: 'minecraftpeayer.github.io',
        description: 'My personal website',
        language: 'TypeScript',
        stars: 0,
        image: '/avatar.png',
    },
    // 可以添加更多倉庫
];

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                duration: 0.8,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: 'easeOut',
            },
        },
    };

    const menuItems = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Projects', href: '/projects' },
        { name: 'Blog', href: '/blog' },
    ];

    return (
        <motion.div
            className="p-8 bg-gray-950 min-h-[100vh] w-[100vw] relative"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div id="profile" className="flex h-40" variants={item}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 20,
                        duration: 1,
                    }}
                >
                    <Image
                        src={Avatar}
                        width={128}
                        height={128}
                        alt="avatar"
                        className="rounded-full m-4"
                    />
                </motion.div>
                <div className="p-2 py-[50px]">
                    <motion.p className="text-2xl" variants={item}>
                        <b>MinecraftPEayer</b>
                    </motion.p>
                    <motion.p className="text-gray-700 text-sm" variants={item}>
                        Just a noob Full-Stack developer
                    </motion.p>
                </div>
            </motion.div>

            <motion.div id="links" variants={item}>
                <motion.p className="mb-4 text-2xl" variants={item}>
                    <b>Links</b>
                </motion.p>
                <motion.div variants={container}>
                    {[
                        {
                            href: 'https://discord.com/users/minecraftpeayer',
                            icon: DiscordLogo.src,
                            text: '@minecraftpeayer',
                            hoverColor: '#5865F2',
                        },
                        {
                            href: 'https://github.com/MinecraftPEayer',
                            icon: GitHubLogo.src,
                            text: 'MinecraftPEayer',
                            hoverColor: '#24292e',
                        },
                        {
                            href: 'https://twitter.com/MinecraftPEayer',
                            icon: TwitterLogo.src,
                            text: '@MinecraftPEayer',
                            hoverColor: '#1DA1F2',
                        },
                        {
                            href: 'https://t.me/MinecraftPEayer',
                            icon: TelegramLogo.src,
                            text: '@MinecraftPEayer',
                            hoverColor: '#0088cc',
                        },
                    ].map((link) => (
                        <motion.a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            className="block"
                            variants={item}
                        >
                            <div
                                className={`w-full h-20 bg-gray-900 hover:bg-[${link.hoverColor}] rounded-xl mt-2 p-6 flex flex-1 items-center transition-colors`}
                            >
                                <Image
                                    src={link.icon}
                                    alt=""
                                    width={32}
                                    height={32}
                                />
                                <p className="text-lg flex-1 text-center">
                                    <b>{link.text}</b>
                                </p>
                            </div>
                        </motion.a>
                    ))}
                </motion.div>
            </motion.div>

            <motion.div id="repositories" variants={item} className="mt-12">
                <p className="text-2xl mb-6">
                    <b>Active Repositories</b>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {repositories.map((repo, index) => (
                        <motion.div
                            key={repo.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                delay: index * 0.2,
                                ease: 'easeOut',
                            }}
                            className="bg-gray-900 p-4 rounded-xl relative overflow-hidden group"
                            style={{
                                backgroundImage: `url(${repo.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center left',
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-gray-900 z-0" />
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold">
                                            {repo.name}
                                        </h3>
                                        <p className="text-gray-400 text-sm">
                                            {repo.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-400">
                                            ★
                                        </span>
                                        <span className="text-sm">
                                            {repo.stars}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-sm text-gray-400">
                                        {repo.language}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <div className="fixed bottom-8 right-8 z-50">
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{
                        scale: 1,
                        rotate: isMenuOpen ? 180 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                >
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16m-7 6h7"
                        />
                    </svg>
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: isMenuOpen ? 1 : 0,
                        scale: isMenuOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-14 right-0 mb-2"
                >
                    <div className="bg-gray-800 rounded-lg shadow-lg p-2 min-w-[120px]">
                        {menuItems.map((item) => (
                            <motion.button
                                key={item.href}
                                onClick={() => {
                                    router.push(item.href);
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded transition-colors block"
                                whileHover={{ scale: 1.05 }}
                            >
                                {item.name}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
