// src/components/InstructorCard.jsx
import React from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import {
    UserGroupIcon,
    PlayIcon,
} from '@heroicons/react/24/outline'

export default function InstructorCard({
    name,
    role,
    avatar,
    rating,
    trainees,
    courses,
    bio,
    socials = [],
    showStats = true,
    showSocials = false,
    className = ''
}) {
    return (
        <div className={` rounded-xl p-6 ${className}`}>
            {/* — HEADER: avatar + name/role */}
            <div className="flex items-center gap-4">
                <img
                    src={avatar}
                    alt={name}
                    className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                    <p className="text-lg font-semibold">{name}</p>
                    <p className="text-gray-500">{role}</p>
                </div>
            </div>

            {/* — STATS ROW */}
            {showStats && (
                <ul className="flex items-center gap-6 mt-4 text-gray-600">
                    {typeof rating === 'number' && (
                        <li className="flex items-center gap-1">
                            <StarIcon className="w-5 h-5 text-yellow-400" />
                            <span>{rating}</span>
                        </li>
                    )}
                    {typeof trainees === 'number' && (
                        <li className="flex items-center gap-1">
                            <UserGroupIcon className="w-5 h-5 text-primary" />
                            <span>{trainees} متدرب</span>
                        </li>
                    )}
                    {typeof courses === 'number' && (
                        <li className="flex items-center gap-1">
                            <PlayIcon className="w-5 h-5 text-primary" />
                            <span>{courses} برامج التدريبية</span>
                        </li>
                    )}
                </ul>
            )}

            {/* — SOCIAL ICONS */}
            {showSocials && socials.length > 0 && (
                <div className="mt-4 flex gap-4">
                    {socials.map(({ icon: Icon, url }, i) => (
                        <div className='bg-primary text-white p-2 rounded-full'>
                            <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className=" hover:translate-y-1 transition"
                            >
                                <Icon className="w-6 h-6" />
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {/* — BIO */}
            {bio && <p className="mt-4 text-gray-700 leading-relaxed">{bio}</p>}

        </div>
    )
}
