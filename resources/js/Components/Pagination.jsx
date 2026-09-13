import { Button, Stack } from '@mui/material';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
            {links.map((link, index) => {
                const disabled = !link.url;
                const content = (
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                );

                if (disabled) {
                    return (
                        <Button
                            key={index}
                            size="small"
                            disabled
                            variant="outlined"
                            sx={{ minWidth: 36 }}
                        >
                            {content}
                        </Button>
                    );
                }

                return (
                    <Button
                        key={index}
                        component={Link}
                        href={link.url}
                        preserveScroll
                        size="small"
                        variant={link.active ? 'contained' : 'outlined'}
                        color={link.active ? 'primary' : 'inherit'}
                        sx={{ minWidth: 36 }}
                    >
                        {content}
                    </Button>
                );
            })}
        </Stack>
    );
}
