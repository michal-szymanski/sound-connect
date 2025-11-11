import React from 'react';
import { Link } from '@react-email/components';
import { button, fontFamily } from '../styles';

type Props = {
    href: string;
    children: string;
};

export function EmailButton({ href, children }: Props) {
    return (
        <table
            width="100%"
            cellPadding="0"
            cellSpacing="0"
            role="presentation"
            style={{
                textAlign: 'center',
                margin: '32px 0'
            }}
        >
            <tr>
                <td align="center">
                    <Link
                        href={href}
                        style={{
                            ...button,
                            fontFamily
                        }}
                    >
                        {children}
                    </Link>
                </td>
            </tr>
        </table>
    );
}
