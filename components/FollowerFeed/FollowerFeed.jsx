import { getPostsStateless, getFollowersForUser, getIsFollowing, identity } from 'deso-protocol';
import { useEffect, useState, useContext } from 'react';
import { DeSoIdentityContext } from 'react-deso-protocol';
import Link from 'next/link';
import {
  Text,
  Avatar,
  Group,
  Paper,
  Center,
  Space,
  UnstyledButton,
  Container,
  Loader,
  Button,
  Checkbox,
} from '@mantine/core';
import { GiWaveCrest } from 'react-icons/gi';
import { LiaUsersSolid } from 'react-icons/lia';
import Post from '@/components/Post';
import CloseFriendFeed from '@/components/CloseFriendFeed';

export const FollowerFeed = () => {
  const { currentUser } = useContext(DeSoIdentityContext);
  const [followerFeed, setFollowerFeed] = useState([]);
  const userPublicKey = currentUser?.PublicKeyBase58Check;
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const fetchFollowerFeed = async () => {
      try {
        setIsLoading(true);

        const followerFeedData = await getPostsStateless({
          ReaderPublicKeyBase58Check: userPublicKey,
          NumToFetch: 100,
          GetPostsForFollowFeed: true,
          FetchSubcomments: true,
        });

        setFollowerFeed(followerFeedData.PostsFound);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error('Error fetching user hotFeed:', error);
      }
    };

    if (currentUser) {
      fetchFollowerFeed();
    }
  }, [currentUser]);

  return (
    <>
      <div>
        {currentUser ? (
          <>
            <Space h="md" />
            <Checkbox
              label={
                <UnstyledButton component={Link} href="/closeFriends">
                  <Group>
                    <LiaUsersSolid size="1.5rem" />
                    <Text fw={500} size="xs">
                      Close Friends
                    </Text>
                  </Group>
                </UnstyledButton>
              }
              checked={checked}
              onChange={(event) => setChecked(event.currentTarget.checked)}
            />

            {checked ? (
              <CloseFriendFeed />
            ) : (
              <>
                {followerFeed && followerFeed.length > 0 ? (
                  followerFeed.map((post) => (
                    <Post
                      post={post}
                      username={post.ProfileEntryResponse?.Username}
                      key={post.PostHashHex}
                    />
                  ))
                ) : (
                  <>
                    {isLoading ? (
                      <>
                        <Space h="md" />
                        <Group justify="center">
                          <Loader />
                        </Group>
                      </>
                    ) : (
                      <>
                        <Space h="md" />
                        <Container size="30rem" px={0}>
                          <Paper shadow="xl" p="lg" withBorder>
                            <Center>
                              <Text size="md" fw={400}>
                                Follow some creators to view their posts here!
                              </Text>
                            </Center>
                          </Paper>
                        </Container>
                        <Space h={222} />
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Space h="md" />
            <Container size="30rem" px={0}>
              <Paper shadow="xl" p="lg" withBorder>
                <Center>
                  <Text size="md" fw={400}>
                    Sign In to view your Following Feed.
                  </Text>
                </Center>
                <Space h="md" />

                <Button
                  fullWidth
                  leftSection={<GiWaveCrest size="1rem" />}
                  variant="gradient"
                  gradient={{ from: 'cyan', to: 'indigo' }}
                  onClick={() => {
                    identity();
                  }}
                >
                  Sign In
                </Button>
              </Paper>
            </Container>
          </>
        )}
      </div>
    </>
  );
};
